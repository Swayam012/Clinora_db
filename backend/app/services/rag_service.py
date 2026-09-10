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
    """
    from app.models.document import Document

    collection = get_chroma_collection()
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


# ──────────────────────────────────────────────
# 2. Semantic Search
# ──────────────────────────────────────────────

def search_clinical_vectors(
    query: str,
    patient_id: Optional[uuid.UUID] = None,
    top_k: int = 4,
) -> List[CitationItem]:
    """
    Performs cosine similarity search across indexed clinical chunks.
    """
    collection = get_chroma_collection()
    where_filter = None
    if patient_id:
        where_filter = {"patient_id": str(patient_id)}

    try:
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as e:
        logger.warning(f"ChromaDB query failed: {e}")
        return []

    citations = []
    if results and results.get("documents") and len(results["documents"]) > 0:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []

        for i in range(len(docs)):
            meta = metas[i] if i < len(metas) else {}
            dist = distances[i] if i < len(distances) else 0.5
            # Cosine distance to similarity (1.0 = exact match)
            similarity = max(0.0, min(1.0, round(1.0 - (dist / 2.0), 3)))

            excerpt = docs[i]
            if len(excerpt) > 280:
                excerpt = excerpt[:280] + "..."

            citations.append(CitationItem(
                document_id=uuid.UUID(meta.get("document_id", str(uuid.uuid4()))),
                document_title=meta.get("document_title", "Clinical Document"),
                patient_name=meta.get("patient_name"),
                patient_id=meta.get("patient_custom_id"),
                document_type=meta.get("document_type"),
                excerpt=excerpt,
                similarity_score=similarity,
            ))

    return citations


# ──────────────────────────────────────────────
# 3. Grounded Clinical RAG Q&A
# ──────────────────────────────────────────────

def generate_rag_answer_with_gemini(query: str, citations: List[CitationItem]) -> Optional[str]:
    """
    Uses Google Gemini to synthesize a grounded medical response based on retrieved citations.
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
2. If the excerpts do not contain enough information, state clearly that the specific information is not recorded in the available documents.
3. Explicitly mention the document title and patient name when citing clinical findings or prescribed medications.
4. Keep the answer professional, structured, concise, and clinically actionable.

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


def generate_heuristic_rag_answer(query: str, citations: List[CitationItem]) -> str:
    """
    Grounded clinical synthesis fallback when LLM API key is not supplied.
    """
    if not citations:
        return (
            f"No relevant clinical records were found matching '{query}'. "
            "Please ensure documents are uploaded, processed with OCR, and indexed."
        )

    # Group by patient
    patient_names = list(dict.fromkeys([c.patient_name for c in citations if c.patient_name]))
    pt_str = ", ".join(patient_names) if patient_names else "the patient"

    summary_lines = [
        f"Based on clinical records for **{pt_str}**, the following relevant findings were retrieved:\n"
    ]

    for idx, c in enumerate(citations[:3], 1):
        summary_lines.append(
            f"**{idx}. [{c.document_title}]** ({c.patient_name or 'Patient'} - {c.patient_id or ''}):\n"
            f"> {c.excerpt}\n"
        )

    summary_lines.append(
        "Note: Information extracted directly from uploaded medical records and verified with vector similarity score."
    )

    return "\n".join(summary_lines)


def answer_clinical_query(
    db: Session,
    query: str,
    patient_id: Optional[uuid.UUID] = None,
    top_k: int = 4,
) -> RAGQueryResponse:
    """
    Main entry point for Phase 7 Clinical RAG.
    1. Ensures collection is populated (auto-indexes if empty).
    2. Retrieves top-k semantically relevant chunks from ChromaDB.
    3. Prompts LLM (or heuristic engine) with retrieved context.
    4. Returns grounded answer with exact document citations.
    """
    collection = get_chroma_collection()

    # Auto-index if vector store is currently empty
    if collection.count() == 0:
        logger.info("ChromaDB collection is empty. Running initial indexing...")
        index_all_documents(db)

    citations = search_clinical_vectors(query, patient_id=patient_id, top_k=top_k)

    # 1. Try Gemini Grounded Synthesis
    answer = generate_rag_answer_with_gemini(query, citations)
    model_used = f"gemini-{settings.LLM_MODEL}"

    # 2. Fallback to Grounded Heuristic Synthesis
    if not answer:
        answer = generate_heuristic_rag_answer(query, citations)
        model_used = "clinora-grounded-rag-engine"

    return RAGQueryResponse(
        query=query,
        answer=answer,
        citations=citations,
        model_used=model_used,
        confidence="High" if citations else "Low",
    )
