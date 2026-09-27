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

# Default empty demo list kept for type compatibility if imported anywhere
DEMO_PATIENTS_GRAPH = []


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
    """Builds a complete entity-relationship subgraph for a given patient from PostgreSQL."""
    nodes: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []

    # Try loading patient from PostgreSQL database by UUID or custom ID
    patient_record = None
    try:
        if len(patient_id_str) == 36:  # valid UUID
            patient_record = db.query(Patient).filter(Patient.id == uuid.UUID(patient_id_str)).first()
        else:
            patient_record = db.query(Patient).filter(Patient.patient_id == patient_id_str).first()
    except Exception as e:
        logger.warning(f"Could not load patient from DB: {e}")

    patient_name = "Patient"
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
                "phone": patient_record.phone or "N/A",
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

    stats = compute_graph_stats(list(nodes.values()), edges)

    return GraphData(
        nodes=list(nodes.values()),
        edges=edges,
        stats=stats,
        patient_id=patient_id_str,
        patient_name=patient_name,
    )


def build_global_graph(db: Session, limit: int = 50) -> GraphData:
    """Builds a connected multi-patient clinical knowledge graph from real database records."""
    nodes: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []

    # Query all active patients from PostgreSQL
    patients = db.query(Patient).filter(Patient.is_active == True).limit(limit).all()
    for patient in patients:
        sub = build_patient_graph(db, str(patient.id))
        for n in sub.nodes:
            nodes[n.id] = n
        for e in sub.edges:
            edges.append(e)

    stats = compute_graph_stats(list(nodes.values()), edges)

    return GraphData(
        nodes=list(nodes.values()),
        edges=edges,
        stats=stats,
        patient_id="global",
        patient_name="Global Hospital Cohort",
    )


def compute_graph_stats(nodes: List[GraphNode], edges: List[GraphEdge]) -> GraphStats:
    """Calculates node and relationship counts dynamically from graph data."""
    node_types: Dict[str, int] = {}
    for n in nodes:
        node_types[n.type] = node_types.get(n.type, 0) + 1

    edge_types: Dict[str, int] = {}
    for e in edges:
        edge_types[e.type] = edge_types.get(e.type, 0) + 1

    # Dynamic top diagnoses
    condition_counts: Dict[str, Dict[str, Any]] = {}
    for n in nodes:
        if n.type == "condition":
            name = n.label
            icd10 = n.properties.get("icd10", "N/A")
            if name not in condition_counts:
                condition_counts[name] = {"name": name, "icd10": icd10, "degree": 0}
            condition_counts[name]["degree"] += 1

    top_diag = sorted(condition_counts.values(), key=lambda x: x["degree"], reverse=True)[:5]

    # Dynamic top medications
    medication_counts: Dict[str, Dict[str, Any]] = {}
    for n in nodes:
        if n.type == "medication":
            name = n.properties.get("name") or n.label
            dosage = n.properties.get("dosage", "")
            if name not in medication_counts:
                medication_counts[name] = {"name": name, "dosage": dosage, "patients": 0}
            medication_counts[name]["patients"] += 1

    top_meds = sorted(medication_counts.values(), key=lambda x: x["patients"], reverse=True)[:5]

    return GraphStats(
        total_nodes=len(nodes),
        total_edges=len(edges),
        node_types=node_types,
        edge_types=edge_types,
        top_diagnoses=top_diag,
        top_medications=top_meds,
    )
