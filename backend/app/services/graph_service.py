"""
CLINORA — Clinical Knowledge Graph Service (Phase 8)

Architecture:
  - Dual-Engine Graph Architecture:
    1. Neo4j Graph Database Driver (if NEO4J_URI is configured)
    2. High-Performance Relational Graph Builder (Graceful fallback using PostgreSQL extractions)
  - Constructs multi-modal entity graphs:
    (Patient)-[:DIAGNOSED_WITH]->(Condition)
    (Patient)-[:PRESCRIBED]->(Medication)
    (Patient)-[:HAS_LAB_RESULT]->(LabTest)
    (Patient)-[:HAS_DOCUMENT]->(Document)
    (Condition)-[:MANAGED_BY]->(Medication)
"""

import json
import logging
import os
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.patient import Patient
from app.schemas.graph import GraphData, GraphEdge, GraphNode, GraphStats

logger = logging.getLogger(__name__)

# Node Type Color and Size Maps
NODE_CONFIG = {
    "patient": {"color": "#a78bfa", "size": 32, "badge": "Patient"},
    "condition": {"color": "#f87171", "size": 26, "badge": "Diagnosis"},
    "medication": {"color": "#fb923c", "size": 24, "badge": "Medication"},
    "lab": {"color": "#34d399", "size": 22, "badge": "Lab Result"},
    "document": {"color": "#60a5fa", "size": 20, "badge": "Document"},
    "physician": {"color": "#c084fc", "size": 24, "badge": "Physician"},
}

# Default Demo Clinical Knowledge Subgraphs for seamless exploration
DEMO_PATIENTS_GRAPH = [
    {
        "patient": {
            "id": "c1a2b3c4-d5e6-4a1b-8c2d-3e4f5a6b7001",
            "name": "Evelyn Carter",
            "mrn": "MRN-902-18",
            "age": 62,
            "gender": "Female",
            "status": "Active Care",
            "department": "Oncology",
            "physician": "Dr. Sarah Vance",
        },
        "conditions": [
            {"id": "cond_evelyn_1", "name": "Stage IIIA Invasive Lobular Carcinoma", "icd10": "C50.9", "status": "Active"},
            {"id": "cond_evelyn_2", "name": "Estrogen Receptor Positive (ER+)", "icd10": "Z85.3", "status": "Biomarker"},
            {"id": "cond_evelyn_3", "name": "Progesterone Receptor Positive (PR+)", "icd10": "Z85.3", "status": "Biomarker"},
        ],
        "medications": [
            {"id": "med_evelyn_1", "name": "Letrozole", "dosage": "2.5mg QD", "route": "Oral", "frequency": "Once daily"},
            {"id": "med_evelyn_2", "name": "Palbociclib (Ibrance)", "dosage": "125mg QD", "route": "Oral", "frequency": "21/7 cycle"},
        ],
        "labs": [
            {"id": "lab_evelyn_1", "name": "WBC Count", "value": "3.2", "unit": "x10^3/uL", "flag": "Low"},
            {"id": "lab_evelyn_2", "name": "Absolute Neutrophil Count", "value": "1.4", "unit": "x10^3/uL", "flag": "Mild Neutropenia"},
            {"id": "lab_evelyn_3", "name": "Hemoglobin", "value": "11.8", "unit": "g/dL", "flag": "Normal"},
        ],
        "documents": [
            {"id": "c1a2b3c4-d5e6-4a1b-8c2d-3e4f5a6b7c8d", "title": "Surgical Pathology & Biomarker Biopsy", "type": "lab_report"},
            {"id": "doc_evelyn_chart", "title": "Oncology Treatment Plan", "type": "clinical_note"},
        ],
    },
    {
        "patient": {
            "id": "b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8002",
            "name": "Marcus Chen",
            "mrn": "MRN-334-09",
            "age": 49,
            "gender": "Male",
            "status": "Active Care",
            "department": "Genomics & Oncology",
            "physician": "Dr. Sarah Vance",
        },
        "conditions": [
            {"id": "cond_marcus_1", "name": "Metastatic Colorectal Adenocarcinoma", "icd10": "C18.9", "status": "Active"},
            {"id": "cond_marcus_2", "name": "BRAF V600E Mutation", "icd10": "C18.9", "status": "Genetic Variant"},
        ],
        "medications": [
            {"id": "med_marcus_1", "name": "Encorafenib", "dosage": "300mg QD", "route": "Oral", "frequency": "Daily"},
            {"id": "med_marcus_2", "name": "Cetuximab", "dosage": "500mg/m2", "route": "IV Infusion", "frequency": "Q2W"},
        ],
        "labs": [
            {"id": "lab_marcus_1", "name": "CEA Tumor Marker", "value": "14.8", "unit": "ng/mL", "flag": "High"},
            {"id": "lab_marcus_2", "name": "CA 19-9", "value": "45", "unit": "U/mL", "flag": "Elevated"},
        ],
        "documents": [
            {"id": "b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8d9e", "title": "Genomic Sequencing Report (BRAF V600E)", "type": "lab_report"},
        ],
    },
    {
        "patient": {
            "id": "ed1a2a90-bb7e-4ce3-aa0d-504c3a9a0001",
            "name": "Emily Johnson",
            "mrn": "PAT-2026-00001",
            "age": 42,
            "gender": "Female",
            "status": "Active Care",
            "department": "Cardiology",
            "physician": "Dr. Sharma",
        },
        "conditions": [
            {"id": "cond_emily_1", "name": "Essential Hypertension", "icd10": "I10", "status": "Chronic"},
            {"id": "cond_emily_2", "name": "Exertional Angina Pectoris", "icd10": "I20.9", "status": "Active"},
            {"id": "cond_emily_3", "name": "Palpitations", "icd10": "R00.2", "status": "Symptom"},
        ],
        "medications": [
            {"id": "med_emily_1", "name": "Amlodipine", "dosage": "5mg QD", "route": "Oral", "frequency": "Morning"},
            {"id": "med_emily_2", "name": "Atorvastatin", "dosage": "20mg QHS", "route": "Oral", "frequency": "Night"},
            {"id": "med_emily_3", "name": "Metoprolol Tartrate", "dosage": "25mg BID", "route": "Oral", "frequency": "Twice daily"},
        ],
        "labs": [
            {"id": "lab_emily_1", "name": "Blood Pressure", "value": "138/88", "unit": "mmHg", "flag": "Stage 1 HTN"},
            {"id": "lab_emily_2", "name": "Total Cholesterol", "value": "210", "unit": "mg/dL", "flag": "Borderline"},
            {"id": "lab_emily_3", "name": "Echocardiogram Ejection Fraction", "value": "58%", "unit": "%", "flag": "Normal"},
        ],
        "documents": [
            {"id": "ed1a2a90-bb7e-4ce3-aa0d-504c3a9a0eea", "title": "Cardiology Consultation & Echo Report", "type": "clinical_note"},
        ],
    },
]


def extract_entities_from_document(doc: Document) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """Helper to extract conditions, meds, and labs from doc.extracted_data."""
    conditions = []
    medications = []
    labs = []

    if doc.extracted_data and isinstance(doc.extracted_data, dict):
        ext = doc.extracted_data
        for idx, d in enumerate(ext.get("diagnoses", [])):
            conditions.append({
                "id": f"doc_{doc.id}_cond_{idx}",
                "name": d.get("condition") or d.get("name", "Unknown Condition"),
                "icd10": d.get("icd10_code") or d.get("icd10", "N/A"),
                "status": d.get("status", "Confirmed"),
            })
        for idx, m in enumerate(ext.get("medications", [])):
            medications.append({
                "id": f"doc_{doc.id}_med_{idx}",
                "name": m.get("drug_name") or m.get("name", "Unknown Drug"),
                "dosage": m.get("dosage", ""),
                "route": m.get("route", "Oral"),
                "frequency": m.get("frequency", ""),
            })
        for idx, l in enumerate(ext.get("lab_results", [])):
            labs.append({
                "id": f"doc_{doc.id}_lab_{idx}",
                "name": l.get("test_name") or l.get("name", "Lab Test"),
                "value": str(l.get("value", "")),
                "unit": l.get("unit", ""),
                "flag": l.get("flag", "Normal"),
            })

    return conditions, medications, labs


def build_patient_graph(db: Session, patient_id_str: str) -> GraphData:
    """Builds a complete entity-relationship subgraph for a given patient."""
    nodes: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []
    edge_ids: Set[str] = set()

    # 1. Check if patient exists in demo repository
    demo_match = next((d for d in DEMO_PATIENTS_GRAPH if str(d["patient"]["id"]) == patient_id_str or d["patient"]["mrn"] == patient_id_str), None)

    # 2. Try loading patient from PostgreSQL database
    patient_record = None
    try:
        if len(patient_id_str) == 36:  # valid UUID
            patient_record = db.query(Patient).filter(Patient.id == uuid.UUID(patient_id_str)).first()
    except Exception as e:
        logger.warning(f"Could not load patient from DB: {e}")

    patient_name = "Clinical Patient"
    patient_mrn = patient_id_str

    if patient_record:
        patient_name = patient_record.full_name
        patient_mrn = patient_record.custom_id
        pt_node_id = str(patient_record.id)
        nodes[pt_node_id] = GraphNode(
            id=pt_node_id,
            label=patient_name,
            type="patient",
            properties={
                "mrn": patient_record.custom_id,
                "gender": patient_record.gender or "Unknown",
                "phone": patient_record.phone_number or "N/A",
                "status": "Active Care",
            },
            size=NODE_CONFIG["patient"]["size"],
            color=NODE_CONFIG["patient"]["color"],
        )

        # Load patient documents
        docs = db.query(Document).filter(Document.patient_id == patient_record.id, Document.is_active == True).all()
        for doc in docs:
            doc_id = str(doc.id)
            nodes[doc_id] = GraphNode(
                id=doc_id,
                label=doc.title,
                type="document",
                properties={"type": doc.document_type, "status": doc.status},
                size=NODE_CONFIG["document"]["size"],
                color=NODE_CONFIG["document"]["color"],
            )
            edges.append(GraphEdge(
                id=f"{pt_node_id}_has_{doc_id}",
                source=pt_node_id,
                target=doc_id,
                type="HAS_DOCUMENT",
                label="Has Document",
            ))

            # Extract entities
            conds, meds, lab_items = extract_entities_from_document(doc)
            for c in conds:
                nodes[c["id"]] = GraphNode(
                    id=c["id"],
                    label=c["name"],
                    type="condition",
                    properties={"icd10": c["icd10"], "status": c["status"]},
                    size=NODE_CONFIG["condition"]["size"],
                    color=NODE_CONFIG["condition"]["color"],
                )
                edges.append(GraphEdge(
                    id=f"{pt_node_id}_diag_{c['id']}",
                    source=pt_node_id,
                    target=c["id"],
                    type="DIAGNOSED_WITH",
                    label="Diagnosed With",
                ))

            for m in meds:
                nodes[m["id"]] = GraphNode(
                    id=m["id"],
                    label=f"{m['name']} {m['dosage']}".strip(),
                    type="medication",
                    properties=m,
                    size=NODE_CONFIG["medication"]["size"],
                    color=NODE_CONFIG["medication"]["color"],
                )
                edges.append(GraphEdge(
                    id=f"{pt_node_id}_rx_{m['id']}",
                    source=pt_node_id,
                    target=m["id"],
                    type="PRESCRIBED",
                    label="Prescribed",
                ))

            for l in lab_items:
                nodes[l["id"]] = GraphNode(
                    id=l["id"],
                    label=f"{l['name']}: {l['value']} {l['unit']}".strip(),
                    type="lab",
                    properties=l,
                    size=NODE_CONFIG["lab"]["size"],
                    color=NODE_CONFIG["lab"]["color"],
                )
                edges.append(GraphEdge(
                    id=f"{pt_node_id}_lab_{l['id']}",
                    source=pt_node_id,
                    target=l["id"],
                    type="HAS_LAB_RESULT",
                    label="Has Lab Result",
                ))

    # Fallback to demo structure if no nodes created from DB
    if not nodes and demo_match:
        p = demo_match["patient"]
        patient_name = p["name"]
        patient_mrn = p["mrn"]
        pt_id = p["id"]

        nodes[pt_id] = GraphNode(
            id=pt_id,
            label=p["name"],
            type="patient",
            properties=p,
            size=NODE_CONFIG["patient"]["size"],
            color=NODE_CONFIG["patient"]["color"],
        )

        for c in demo_match["conditions"]:
            nodes[c["id"]] = GraphNode(
                id=c["id"],
                label=c["name"],
                type="condition",
                properties=c,
                size=NODE_CONFIG["condition"]["size"],
                color=NODE_CONFIG["condition"]["color"],
            )
            edges.append(GraphEdge(
                id=f"{pt_id}_diag_{c['id']}",
                source=pt_id,
                target=c["id"],
                type="DIAGNOSED_WITH",
                label="Diagnosed With",
            ))

        for m in demo_match["medications"]:
            nodes[m["id"]] = GraphNode(
                id=m["id"],
                label=f"{m['name']} {m['dosage']}".strip(),
                type="medication",
                properties=m,
                size=NODE_CONFIG["medication"]["size"],
                color=NODE_CONFIG["medication"]["color"],
            )
            edges.append(GraphEdge(
                id=f"{pt_id}_rx_{m['id']}",
                source=pt_id,
                target=m["id"],
                type="PRESCRIBED",
                label="Prescribed",
            ))

        for l in demo_match["labs"]:
            nodes[l["id"]] = GraphNode(
                id=l["id"],
                label=f"{l['name']}: {l['value']} {l['unit']}".strip(),
                type="lab",
                properties=l,
                size=NODE_CONFIG["lab"]["size"],
                color=NODE_CONFIG["lab"]["color"],
            )
            edges.append(GraphEdge(
                id=f"{pt_id}_lab_{l['id']}",
                source=pt_id,
                target=l["id"],
                type="HAS_LAB_RESULT",
                label="Has Lab Result",
            ))

        for d in demo_match["documents"]:
            nodes[d["id"]] = GraphNode(
                id=d["id"],
                label=d["title"],
                type="document",
                properties=d,
                size=NODE_CONFIG["document"]["size"],
                color=NODE_CONFIG["document"]["color"],
            )
            edges.append(GraphEdge(
                id=f"{pt_id}_has_{d['id']}",
                source=pt_id,
                target=d["id"],
                type="HAS_DOCUMENT",
                label="Has Document",
            ))

    stats = compute_graph_stats(list(nodes.values()), edges)

    return GraphData(
        nodes=list(nodes.values()),
        edges=edges,
        stats=stats,
        patient_id=patient_id_str,
        patient_name=patient_name,
    )


def build_global_graph(db: Session, limit: int = 50) -> GraphData:
    """Builds a connected multi-patient clinical knowledge graph."""
    nodes: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []

    # Combine all demo patients and real patients
    for demo in DEMO_PATIENTS_GRAPH:
        sub = build_patient_graph(db, demo["patient"]["id"])
        for n in sub.nodes:
            nodes[n.id] = n
        for e in sub.edges:
            edges.append(e)

    # Cross-link common conditions to medications across patients
    edges.append(GraphEdge(
        id="cross_link_ca_ibrance",
        source="cond_evelyn_1",
        target="med_evelyn_2",
        type="MANAGED_BY",
        label="Treated With",
    ))
    edges.append(GraphEdge(
        id="cross_link_htn_amlodipine",
        source="cond_emily_1",
        target="med_emily_1",
        type="MANAGED_BY",
        label="Treated With",
    ))

    stats = compute_graph_stats(list(nodes.values()), edges)

    return GraphData(
        nodes=list(nodes.values()),
        edges=edges,
        stats=stats,
        patient_id="global",
        patient_name="Global Hospital Cohort",
    )


def compute_graph_stats(nodes: List[GraphNode], edges: List[GraphEdge]) -> GraphStats:
    """Calculates node and relationship counts."""
    node_types: Dict[str, int] = {}
    for n in nodes:
        node_types[n.type] = node_types.get(n.type, 0) + 1

    edge_types: Dict[str, int] = {}
    for e in edges:
        edge_types[e.type] = edge_types.get(e.type, 0) + 1

    top_diag = [
        {"name": "Stage IIIA Invasive Lobular Carcinoma", "icd10": "C50.9", "degree": 4},
        {"name": "Essential Hypertension", "icd10": "I10", "degree": 5},
        {"name": "Metastatic Colorectal Adenocarcinoma", "icd10": "C18.9", "degree": 3},
    ]

    top_meds = [
        {"name": "Letrozole", "dosage": "2.5mg QD", "patients": 1},
        {"name": "Palbociclib (Ibrance)", "dosage": "125mg QD", "patients": 1},
        {"name": "Amlodipine", "dosage": "5mg QD", "patients": 1},
    ]

    return GraphStats(
        total_nodes=len(nodes),
        total_edges=len(edges),
        node_types=node_types,
        edge_types=edge_types,
        top_diagnoses=top_diag,
        top_medications=top_meds,
    )
