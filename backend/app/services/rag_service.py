"""
CLINORA — Clinical RAG & Semantic Search Service (Phase 7)

Architecture:
  - Vector Store: ChromaDB (persistent local vector database)
  - Embedding: ChromaDB Default Embedding Function / Gemini Embedding
  - Chunking: Semantic clinical text chunker (OCR text + extracted entities)
  - Retrieval: Filtered Top-K semantic cosine search
  - Generation: Gemini LLM Grounded Clinical Q&A with strict document citations
"""

import json
import logging
import os
import re
import uuid
from typing import List, Optional, Tuple

import chromadb
from chromadb.config import Settings as ChromaSettings
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.redis import redis_cache_get, redis_cache_set
from app.models.document import Document
from app.models.patient import Patient
from app.repositories.document_repository import get_document_by_id
from app.schemas.rag import (
    CitationItem,
    IndexStatusResponse,
    RAGQueryResponse,
    SemanticSearchResult,
)

logger = logging.getLogger(__name__)

# Initialize persistent ChromaDB client
_chroma_client = None
_chroma_collection = None


def get_chroma_collection():
    """
    Singleton getter for ChromaDB client and clinical document collection.
    """
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        persist_path = os.path.abspath(settings.CHROMA_PERSIST_DIR)
        os.makedirs(persist_path, exist_ok=True)
        logger.info(f"Initializing persistent ChromaDB client at: {persist_path}")

        _chroma_client = chromadb.PersistentClient(
            path=persist_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        _chroma_collection = _chroma_client.get_or_create_collection(
            name="clinora_clinical_documents",
            metadata={"hnsw:space": "cosine"},
        )
    return _chroma_collection


# ──────────────────────────────────────────────
# 1. Document Chunking & Indexing
# ──────────────────────────────────────────────

def create_document_chunks(doc: Document) -> List[Tuple[str, str, dict]]:
    """
    Generates semantic text chunks and metadata from a clinical document.
    Returns list of (chunk_id, chunk_text, metadata).
    """
    chunks = []
    patient_name = doc.patient.full_name if doc.patient else "Unknown Patient"
    patient_custom_id = doc.patient.custom_id if doc.patient else "PAT-UNKNOWN"
    doc_id_str = str(doc.id)
    patient_id_str = str(doc.patient_id)

    base_meta = {
        "document_id": doc_id_str,
        "document_title": doc.title,
        "patient_name": patient_name,
        "patient_custom_id": patient_custom_id,
        "patient_id": patient_id_str,
        "document_type": doc.document_type or "other",
        "created_at": doc.created_at.isoformat() if doc.created_at else "",
    }

    # 1. Structured Clinical Summary Chunk (from Phase 6 extracted_data)
    if doc.extracted_data and isinstance(doc.extracted_data, dict):
        ext = doc.extracted_data
        summary_parts = [
            f"CLINICAL DOCUMENT SUMMARY for Patient {patient_name} (ID: {patient_custom_id})",
            f"Document Title: {doc.title} | Category: {doc.document_type}",
        ]

        if ext.get("clinical_summary"):
            summary_parts.append(f"Executive Summary: {ext['clinical_summary']}")

        if ext.get("diagnoses"):
            diag_str = ", ".join([f"{d.get('condition')} (ICD-10: {d.get('icd10_code', 'N/A')})" for d in ext["diagnoses"]])
            summary_parts.append(f"Diagnoses: {diag_str}")

        if ext.get("medications"):
            med_str = ", ".join([f"{m.get('drug_name')} {m.get('dosage', '')} ({m.get('frequency', '')})" for m in ext["medications"]])
            summary_parts.append(f"Prescribed Medications: {med_str}")

        if ext.get("symptoms"):
            sym_str = ", ".join([f"{s.get('symptom')} (onset: {s.get('onset', 'N/A')})" for s in ext["symptoms"]])
            summary_parts.append(f"Symptoms & Complaints: {sym_str}")

        if ext.get("vitals"):
            vitals_str = ", ".join([f"{k}: {v}" for k, v in ext["vitals"].items() if v])
            if vitals_str:
                summary_parts.append(f"Vital Signs: {vitals_str}")

        if ext.get("lab_results"):
            lab_str = ", ".join([f"{l.get('test_name')}: {l.get('value')} {l.get('unit', '')} ({l.get('flag', 'normal')})" for l in ext["lab_results"]])
            summary_parts.append(f"Lab Results: {lab_str}")

        structured_text = "\n".join(summary_parts)
        chunks.append((f"{doc_id_str}_summary", structured_text, {**base_meta, "chunk_type": "structured_summary"}))

    # 2. Raw OCR Text Chunks (sliding window)
    ocr_text = doc.ocr_text or ""
    if len(ocr_text.strip()) > 30:
        clean_text = re.sub(r"\s+", " ", ocr_text).strip()
        chunk_size = 600
        overlap = 100
        start = 0
        idx = 0

        while start < len(clean_text):
            end = min(start + chunk_size, len(clean_text))
            chunk_content = clean_text[start:end]
            formatted_chunk = f"Source Document [{doc.title}] for {patient_name}:\n{chunk_content}"
            chunks.append((f"{doc_id_str}_ocr_{idx}", formatted_chunk, {**base_meta, "chunk_type": "ocr_text", "chunk_index": str(idx)}))
            start += chunk_size - overlap
            idx += 1

    # If neither exists, create a minimal metadata chunk
    if not chunks:
        minimal_text = f"Clinical Document: {doc.title} for patient {patient_name} (ID: {patient_custom_id}). Type: {doc.document_type}."
        chunks.append((f"{doc_id_str}_meta", minimal_text, {**base_meta, "chunk_type": "metadata"}))

    return chunks


def index_single_document(db: Session, document_id: uuid.UUID):
    """
    Indexes or updates a single document in ChromaDB.
    """
    doc = get_document_by_id(db, document_id)
    if not doc or not doc.is_active:
        return 0

    collection = get_chroma_collection()
    doc_id_str = str(doc.id)

    # Delete existing chunks for this document
    try:
        collection.delete(where={"document_id": doc_id_str})
    except Exception:
        pass

    chunks = create_document_chunks(doc)
    if not chunks:
        return 0

    ids = [c[0] for c in chunks]
    documents = [c[1] for c in chunks]
    metadatas = [c[2] for c in chunks]

    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
    )
    logger.info(f"Indexed document {document_id} ({doc.title}) with {len(chunks)} chunks into ChromaDB.")
    return len(chunks)


def index_all_documents(db: Session) -> IndexStatusResponse:
    """
    Indexes all active documents from PostgreSQL into the ChromaDB vector database.
    Wipes stale/orphaned chunks to maintain 100% data consistency with PostgreSQL.
    """
    from app.models.document import Document

    collection = get_chroma_collection()

    # Clear all stale/orphaned chunks from ChromaDB before rebuilding index
    try:
        all_data = collection.get()
        if all_data and all_data.get("ids") and len(all_data["ids"]) > 0:
            collection.delete(ids=all_data["ids"])
            logger.info(f"Cleared {len(all_data['ids'])} stale chunks from ChromaDB during reindex.")
    except Exception as e:
        logger.warning(f"Could not purge existing chunks before reindexing: {e}")

    docs = db.query(Document).filter(Document.is_active == True).all()

    total_chunks = 0
    indexed_docs = 0

    for doc in docs:
        count = index_single_document(db, doc.id)
        if count > 0:
            indexed_docs += 1
            total_chunks += count

    logger.info(f"Complete vector indexing finished: {indexed_docs} documents, {total_chunks} chunks.")
    return IndexStatusResponse(
        indexed_documents=indexed_docs,
        total_chunks=total_chunks,
        status="ready",
    )


def delete_patient_vectors(patient_id: uuid.UUID):
    """Deletes all vector embeddings for a patient from ChromaDB."""
    try:
        collection = get_chroma_collection()
        collection.delete(where={"patient_id": str(patient_id)})
        logger.info(f"Deleted vector chunks for patient {patient_id}")
    except Exception as e:
        logger.warning(f"Failed to delete vectors for patient {patient_id}: {e}")


def delete_document_vectors(document_id: uuid.UUID):
    """Deletes all vector embeddings for a document from ChromaDB."""
    try:
        collection = get_chroma_collection()
        collection.delete(where={"document_id": str(document_id)})
        logger.info(f"Deleted vector chunks for document {document_id}")
    except Exception as e:
        logger.warning(f"Failed to delete vectors for document {document_id}: {e}")


# ──────────────────────────────────────────────
# 2. Semantic Search
# ──────────────────────────────────────────────

def search_clinical_vectors(
    query: str,
    patient_id: Optional[uuid.UUID] = None,
    top_k: int = 4,
    db: Optional[Session] = None,
) -> List[CitationItem]:
    """
    Performs cosine similarity search across indexed clinical chunks with document-level deduplication.
    Verifies that all returned documents are active in PostgreSQL and purges orphaned chunks.
    """
    collection = get_chroma_collection()
    where_filter = None
    if patient_id:
        where_filter = {"patient_id": str(patient_id)}

    candidate_k = max(top_k * 4, 16)

    try:
        results = collection.query(
            query_texts=[query],
            n_results=candidate_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as e:
        logger.warning(f"ChromaDB query failed: {e}")
        return []

    if not results or not results.get("documents") or len(results["documents"]) == 0:
        return []

    docs = results["documents"][0]
    metas = results["metadatas"][0] if results.get("metadatas") else []
    distances = results["distances"][0] if results.get("distances") else []

    doc_map = {}
    orphaned_doc_ids = []

    for i in range(len(docs)):
        meta = metas[i] if i < len(metas) else {}
        dist = distances[i] if i < len(distances) else 0.5
        similarity = max(0.0, min(1.0, round(1.0 - (dist / 2.0), 3)))

        doc_id_str = meta.get("document_id")
        if not doc_id_str:
            continue

        try:
            doc_uuid = uuid.UUID(doc_id_str)
        except Exception:
            continue

        # If db session is provided, verify document is active in PostgreSQL
        if db is not None:
            db_doc = get_document_by_id(db, doc_uuid)
            if not db_doc or not db_doc.is_active:
                orphaned_doc_ids.append(doc_id_str)
                continue

        # Filter out low-similarity noise when no patient filter is specified
        if not patient_id and similarity < 0.48:
            continue

        chunk_type = meta.get("chunk_type", "")
        excerpt = docs[i]
        if len(excerpt) > 280:
            excerpt = excerpt[:280] + "..."

        citation = CitationItem(
            document_id=doc_uuid,
            document_title=meta.get("document_title", "Clinical Document"),
            patient_name=meta.get("patient_name"),
            patient_id=meta.get("patient_custom_id"),
            document_type=meta.get("document_type"),
            excerpt=excerpt,
            similarity_score=similarity,
        )

        if doc_id_str not in doc_map:
            doc_map[doc_id_str] = citation
        else:
            existing = doc_map[doc_id_str]
            if chunk_type == "structured_summary" or similarity > existing.similarity_score:
                doc_map[doc_id_str] = citation

    # Clean up any orphaned chunks found in vector DB
    if orphaned_doc_ids:
        try:
            for orphan_id in set(orphaned_doc_ids):
                collection.delete(where={"document_id": orphan_id})
            logger.info(f"Purged {len(orphaned_doc_ids)} orphaned vector chunks from ChromaDB.")
        except Exception:
            pass

    deduped_citations = sorted(doc_map.values(), key=lambda c: c.similarity_score, reverse=True)
    return deduped_citations[:top_k]


# ──────────────────────────────────────────────
# 3. Grounded Clinical RAG Q&A
# ──────────────────────────────────────────────

def generate_rag_answer_with_gemini(query: str, citations: List[CitationItem]) -> Optional[str]:
    """
    Uses Google Gemini to synthesize a grounded medical response based on deduplicated citations.
    """
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your_") or len(api_key) < 15:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=api_key)

        context_text = "\n\n".join([
            f"--- CITATION {idx+1}: {c.document_title} (Patient: {c.patient_name}, ID: {c.patient_id}) ---\n{c.excerpt}"
            for idx, c in enumerate(citations)
        ])

        prompt = f"""
You are the Clinora AI Clinical Decision Support Assistant.
Answer the following healthcare provider query based EXCLUSIVELY on the provided clinical document excerpts.

CLINICAL GUIDELINES:
1. Ground every statement strictly in the provided excerpts.
2. DEDUPLICATE information per patient: Provide exactly ONE consolidated response per patient. Do NOT repeat raw excerpts or print duplicated sections.
3. If the query asks for prescriptions or medications, list them clearly with drug name, dosage, frequency, and duration.
4. Explicitly mention the document title and patient name.
5. Keep the answer professional, structured, concise, and clinically actionable.

CONTEXT MEDICAL EXCERPTS:
{context_text}

CLINICAL QUERY:
{query}
"""

        response = client.models.generate_content(
            model=settings.LLM_MODEL,
            contents=prompt,
        )

        if response and response.text:
            return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini RAG synthesis failed: {e}")

    return None


def generate_heuristic_rag_answer(
    db: Session,
    query: str,
    citations: List[CitationItem],
) -> str:
    """
    Grounded clinical synthesis engine that extracts key diagnostic, therapeutic, and biomarker facts
    from verified document records and formats a clean, consolidated, non-repetitive response.
    """
    if not citations:
        return (
            f"No relevant clinical records were found matching '{query}'. "
            "Please ensure documents are uploaded, processed with OCR, and indexed into the clinical database."
        )

    # Detect query intent
    is_rx_query = bool(re.search(r"\b(prescription|prescriptions|rx|medication|medications|drug|drugs|medicine|medicines|dose|dosage)\b", query, re.I))
    is_diag_query = bool(re.search(r"\b(diagnosis|diagnoses|condition|conditions|disease|diseases|icd|problem|problems)\b", query, re.I))
    is_vitals_query = bool(re.search(r"\b(vital|vitals|bp|blood pressure|pulse|heart rate|temp|temperature|spo2|oxygen)\b", query, re.I))
    is_labs_query = bool(re.search(r"\b(lab|labs|test|tests|result|results|blood|panel|cholesterol|sugar|glucose)\b", query, re.I))

    # Retrieve matching document entities from database
    doc_ids = list(dict.fromkeys([c.document_id for c in citations]))
    doc_records = []
    for doc_id in doc_ids:
        doc = get_document_by_id(db, doc_id)
        if doc and doc.is_active:
            doc_records.append(doc)

    if not doc_records:
        pt_names = list(dict.fromkeys([c.patient_name for c in citations if c.patient_name]))
        pt_str = ", ".join(pt_names) if pt_names else "Patient"
        lines = [
            f"### 📋 Clinical Summary for {pt_str}\n",
        ]
        for c in citations[:2]:
            lines.append(f"**[{c.document_title}]** - `{c.patient_id or 'N/A'}`\n> {c.excerpt}\n")
        return "\n".join(lines)

    # Group documents by patient
    patient_groups = {}
    for doc in doc_records:
        p_name = doc.patient.full_name if doc.patient else "Patient"
        p_id = doc.patient.custom_id if doc.patient else "PAT-UNKNOWN"
        key = (p_name, p_id)
        if key not in patient_groups:
            patient_groups[key] = []
        patient_groups[key].append(doc)

    # If query specifically mentions a patient name or ID, focus exclusively on that patient
    query_lower = query.lower()
    matched_named_groups = {}
    for (p_name, p_id), p_docs in patient_groups.items():
        name_tokens = [t.lower() for t in p_name.split() if len(t) >= 3]
        if (p_name.lower() in query_lower) or (p_id.lower() in query_lower) or any(tok in query_lower for tok in name_tokens):
            matched_named_groups[(p_name, p_id)] = p_docs

    if matched_named_groups:
        patient_groups = matched_named_groups

    output_blocks = []

    for (p_name, p_id), p_docs in patient_groups.items():
        block_lines = []
        block_lines.append(f"### 📋 Clinical Summary for **{p_name}** (`{p_id}`)")

        all_meds = []
        all_diags = []
        all_vitals = {}
        all_labs = []
        all_allergies = []
        summaries = []
        doc_titles = []

        for doc in p_docs:
            doc_titles.append(f"[{doc.title}]")
            ext = doc.extracted_data
            if not ext and doc.ocr_text:
                from app.services.clinical_extraction_service import extract_heuristic_fallback
                try:
                    ext = extract_heuristic_fallback(doc.ocr_text)
                except Exception:
                    ext = None

            if ext and isinstance(ext, dict):
                if ext.get("clinical_summary"):
                    summaries.append(ext["clinical_summary"])
                if ext.get("medications"):
                    for m in ext["medications"]:
                        if isinstance(m, dict) and m.get("drug_name"):
                            if not any(x.get("drug_name", "").lower() == m["drug_name"].lower() for x in all_meds):
                                all_meds.append(m)
                if ext.get("diagnoses"):
                    for d in ext["diagnoses"]:
                        if isinstance(d, dict) and d.get("condition"):
                            if not any(x.get("condition", "").lower() == d["condition"].lower() for x in all_diags):
                                all_diags.append(d)
                if ext.get("vitals") and isinstance(ext["vitals"], dict):
                    for vk, vv in ext["vitals"].items():
                        if vv and vk not in all_vitals:
                            all_vitals[vk] = vv
                if ext.get("lab_results"):
                    for l in ext["lab_results"]:
                        if isinstance(l, dict) and l.get("test_name"):
                            if not any(x.get("test_name", "").lower() == l["test_name"].lower() for x in all_labs):
                                all_labs.append(l)
                if ext.get("allergies"):
                    for a in ext["allergies"]:
                        if isinstance(a, dict) and a.get("allergen"):
                            if not any(x.get("allergen", "").lower() == a["allergen"].lower() for x in all_allergies):
                                all_allergies.append(a)

        doc_source_str = ", ".join(doc_titles)
        block_lines.append(f"*Source Document: {doc_source_str}*\n")

        if is_rx_query:
            if all_meds:
                block_lines.append("#### 💊 Prescribed Medications / Rx Schedule:")
                for m in all_meds:
                    drug = m.get("drug_name", "Medication")
                    dose = m.get("dosage", "")
                    freq = m.get("frequency", "")
                    duration = m.get("duration", "")
                    instr = m.get("instructions", "")

                    details = []
                    if dose:
                        details.append(f"**Dosage:** {dose}")
                    if freq:
                        details.append(f"**Frequency:** {freq}")
                    if duration:
                        details.append(f"**Duration:** {duration}")
                    if instr:
                        details.append(f"**Instructions:** {instr}")

                    detail_str = " | ".join(details) if details else "As directed"
                    block_lines.append(f"- **{drug}** — {detail_str}")
            else:
                block_lines.append("No active medications or prescriptions were explicitly recorded in the referenced documents.")

            if all_diags:
                diag_str = ", ".join([f"{d.get('condition')} ({d.get('icd10_code', 'N/A')})" for d in all_diags])
                block_lines.append(f"\n**Associated Diagnoses:** {diag_str}")

            if all_vitals.get("blood_pressure"):
                block_lines.append(f"**Recorded BP:** {all_vitals['blood_pressure']}")

        elif is_diag_query:
            if all_diags:
                block_lines.append("#### 🩺 Clinical Diagnoses:")
                for d in all_diags:
                    cond = d.get("condition", "Condition")
                    icd = d.get("icd10_code")
                    icd_str = f" [ICD-10: `{icd}`]" if icd and icd != "N/A" else ""
                    conf = d.get("confidence", "High")
                    block_lines.append(f"- **{cond}**{icd_str} *(Confidence: {conf})*")
            else:
                block_lines.append("No specific diagnoses were extracted from the document.")

            if all_meds:
                med_str = ", ".join([f"{m.get('drug_name')} {m.get('dosage', '')}" for m in all_meds])
                block_lines.append(f"\n**Current Pharmacotherapy:** {med_str}")

        elif is_labs_query:
            if all_labs:
                block_lines.append("#### 🧪 Laboratory Test Results:")
                for l in all_labs:
                    flag = l.get("flag", "normal").upper()
                    flag_icon = "⚠️ " if flag in ("HIGH", "LOW", "CRITICAL") else "✓ "
                    val_str = f"{l.get('value')} {l.get('unit', '')}".strip()
                    ref_str = f" (Ref: {l.get('reference_range')})" if l.get("reference_range") else ""
                    block_lines.append(f"- {flag_icon}**{l.get('test_name')}**: `{val_str}` [{flag}]{ref_str}")
            else:
                block_lines.append("No specific laboratory biomarkers found in the referenced documents.")

        elif is_vitals_query:
            if all_vitals:
                block_lines.append("#### 📊 Documented Vital Signs:")
                vital_labels = {
                    "blood_pressure": "Blood Pressure",
                    "heart_rate": "Heart Rate / Pulse",
                    "temperature": "Body Temperature",
                    "oxygen_saturation": "Oxygen Saturation (SpO2)",
                    "respiratory_rate": "Respiratory Rate",
                    "weight": "Weight",
                    "height": "Height",
                    "bmi": "BMI",
                }
                for k, v in all_vitals.items():
                    if v:
                        lbl = vital_labels.get(k, k.replace("_", " ").title())
                        block_lines.append(f"- **{lbl}:** {v}")
            else:
                block_lines.append("No specific vital signs recorded in the referenced documents.")

        else:
            if summaries:
                block_lines.append(f"**Executive Summary:** {summaries[0]}\n")

            if all_diags:
                diag_str = ", ".join([f"{d.get('condition')} ({d.get('icd10_code', 'N/A')})" for d in all_diags])
                block_lines.append(f"- **Diagnoses:** {diag_str}")

            if all_meds:
                med_str = ", ".join([f"{m.get('drug_name')} {m.get('dosage', '')} ({m.get('frequency', '')})" for m in all_meds])
                block_lines.append(f"- **Prescriptions:** {med_str}")

            if all_vitals:
                v_list = [f"{k.replace('_', ' ').title()}: {v}" for k, v in all_vitals.items() if v]
                if v_list:
                    block_lines.append(f"- **Vitals:** {', '.join(v_list[:3])}")

            if all_allergies:
                a_str = ", ".join([a.get("allergen", "") for a in all_allergies if a.get("allergen")])
                if a_str:
                    block_lines.append(f"- **Allergies:** {a_str}")

        output_blocks.append("\n".join(block_lines))

    output_blocks.append("*Grounded in verified clinical records with similarity retrieval.*")
    return "\n\n---\n\n".join(output_blocks)


def answer_clinical_query(
    db: Session,
    query: str,
    patient_id: Optional[uuid.UUID] = None,
    top_k: int = 4,
) -> RAGQueryResponse:
    """
    Main entry point for Phase 7 Clinical RAG.
    1. Checks Redis cache for recent identical clinical query.
    2. Identifies active patients matching query text directly in PostgreSQL.
    3. If patient has unprocessed documents, auto-processes OCR and indexes them.
    4. Retrieves top-k semantically relevant chunks from ChromaDB with document deduplication and active validation.
    5. Prompts LLM (or heuristic engine) with retrieved context.
    6. Stores response in Redis and returns grounded answer with exact document citations.
    """
    clean_query = query.strip()
    cache_key = f"rag:query:{clean_query}:{patient_id or 'global'}:{top_k}"
    cached_res = redis_cache_get(cache_key)
    if cached_res and isinstance(cached_res, dict):
        try:
            return RAGQueryResponse(**cached_res)
        except Exception:
            pass

    collection = get_chroma_collection()

    # Auto-index if vector store is currently empty
    if collection.count() == 0:
        logger.info("ChromaDB collection is empty. Running initial indexing...")
        index_all_documents(db)

    # Check if query specifically names an active patient in PostgreSQL
    matched_active_patient = None
    if not patient_id:
        active_patients = db.query(Patient).filter(Patient.is_active == True).all()
        q_lower = clean_query.lower()
        for p in active_patients:
            p_full = (p.full_name or "").lower()
            p_custom = (p.custom_id or "").lower()
            p_tokens = [t for t in p_full.split() if len(t) >= 3]
            if (p_full and p_full in q_lower) or (p_custom and p_custom in q_lower) or any(t in q_lower for t in p_tokens):
                matched_active_patient = p
                patient_id = p.id
                break

    # If patient is matched, ensure any pending documents are processed and indexed
    if patient_id:
        pt_docs = db.query(Document).filter(Document.patient_id == patient_id, Document.is_active == True).all()
        for doc in pt_docs:
            if not doc.ocr_text:
                try:
                    from app.services.ocr_service import process_document_ocr
                    process_document_ocr(db, doc.id)
                except Exception as e:
                    logger.warning(f"Auto OCR during RAG query failed for document {doc.id}: {e}")
            index_single_document(db, doc.id)

    citations = search_clinical_vectors(clean_query, patient_id=patient_id, top_k=top_k, db=db)

    # If a specific patient was queried but no citations or documents were found
    if matched_active_patient and not citations:
        pt_docs = db.query(Document).filter(Document.patient_id == matched_active_patient.id, Document.is_active == True).all()
        if not pt_docs:
            doc_status_msg = "No clinical documents or lab reports have been uploaded for this patient yet."
        else:
            doc_titles = ", ".join([f"[{d.title}]" for d in pt_docs])
            doc_status_msg = f"Document(s) {doc_titles} are uploaded but contain no extracted digital text."

        answer = (
            f"### 📋 Patient Record: **{matched_active_patient.full_name}** (`{matched_active_patient.custom_id}`)\n\n"
            f"- **Registration Status:** Active in Clinora healthcare system.\n"
            f"- **Clinical Records:** {doc_status_msg}\n"
            f"- **Next Steps:** Please upload a readable PDF or image report in Document Manager to enable AI extraction and query analysis."
        )
        return RAGQueryResponse(
            query=clean_query,
            answer=answer,
            citations=[],
            model_used="clinora-grounded-rag-engine",
            confidence="High",
        )

    # 1. Try Gemini Grounded Synthesis
    answer = generate_rag_answer_with_gemini(clean_query, citations)
    model_used = f"gemini-{settings.LLM_MODEL}"

    # 2. Fallback to Grounded Heuristic Synthesis
    if not answer:
        answer = generate_heuristic_rag_answer(db, clean_query, citations)
        model_used = "clinora-grounded-rag-engine"

    response = RAGQueryResponse(
        query=clean_query,
        answer=answer,
        citations=citations,
        model_used=model_used,
        confidence="High" if citations else "Low",
    )

    # Cache RAG response in Redis for 30 minutes
    try:
        redis_cache_set(cache_key, response.model_dump(mode="json"), ttl_seconds=1800)
    except Exception as e:
        logger.debug(f"Could not cache RAG query in Redis: {e}")

    return response
