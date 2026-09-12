import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.graph import GraphData, GraphStats
from app.services import graph_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["Clinical Knowledge Graph"])


@router.get(
    "/patient/{patient_id}",
    response_model=GraphData,
    summary="Get patient clinical entity subgraph",
)
@limiter.limit("60/minute")
def get_patient_knowledge_graph(
    request: Request,
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves entity-relationship subgraph for a given patient (nodes: Diagnoses, Medications, Labs, Documents).
    """
    try:
        data = graph_service.build_patient_graph(db, patient_id)
        return data
    except Exception as e:
        logger.exception(f"Failed to generate patient knowledge graph for {patient_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient clinical knowledge graph.",
        )


@router.get(
    "/overview",
    response_model=GraphData,
    summary="Get global hospital clinical knowledge graph",
)
@limiter.limit("60/minute")
def get_global_knowledge_graph(
    request: Request,
    limit: int = Query(50, ge=5, le=200, description="Max node threshold"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves the global multi-patient clinical knowledge graph and correlation matrix.
    """
    try:
        data = graph_service.build_global_graph(db, limit=limit)
        return data
    except Exception as e:
        logger.exception(f"Failed to generate global knowledge graph: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve global clinical knowledge graph.",
        )


@router.post(
    "/sync",
    summary="Synchronize all clinical extractions into knowledge graph",
)
@limiter.limit("15/minute")
def sync_knowledge_graph(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Scans and indexes all structured clinical extractions into graph storage.
    """
    try:
        data = graph_service.build_global_graph(db)
        return {
            "status": "success",
            "message": "Clinical Knowledge Graph synchronized successfully.",
            "total_nodes": data.stats.total_nodes,
            "total_edges": data.stats.total_edges,
        }
    except Exception as e:
        logger.exception(f"Knowledge graph synchronization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synchronize clinical knowledge graph.",
        )
