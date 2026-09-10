import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.rag import (
    IndexStatusResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    SemanticSearchResult,
)
from app.services import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["Clinical RAG & Semantic Search"])


@router.post(
    "/query",
    response_model=RAGQueryResponse,
    summary="Ask a clinical question with grounded RAG answer and citations",
)
@limiter.limit("30/minute")
def clinical_rag_query(
    request: Request,
    query_in: RAGQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synthesizes a grounded clinical answer backed by exact document citations
    and vector similarity retrieval.
    """
    try:
        response = rag_service.answer_clinical_query(
            db=db,
            query=query_in.query,
            patient_id=query_in.patient_id,
            top_k=query_in.top_k,
        )
        return response
    except Exception as e:
        logger.exception(f"RAG query execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process clinical Q&A query.",
        )


@router.get(
    "/search",
    response_model=SemanticSearchResult,
    summary="Perform semantic vector search across clinical records",
)
@limiter.limit("60/minute")
def clinical_semantic_search(
    request: Request,
    query: str = Query(..., min_length=2, max_length=500, description="Search query"),
    patient_id: Optional[uuid.UUID] = Query(None, description="Optional patient UUID filter"),
    top_k: int = Query(6, ge=1, le=20, description="Max results to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Performs cosine vector search across indexed clinical documents.
    """
    try:
        # Ensure ChromaDB has indexed documents
        collection = rag_service.get_chroma_collection()
        if collection.count() == 0:
            rag_service.index_all_documents(db)

        citations = rag_service.search_clinical_vectors(
            query=query,
            patient_id=patient_id,
            top_k=top_k,
        )
        return SemanticSearchResult(
            query=query,
            results=citations,
            total_found=len(citations),
        )
    except Exception as e:
        logger.exception(f"Semantic search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute semantic search.",
        )


@router.post(
    "/index",
    response_model=IndexStatusResponse,
    summary="Re-index all clinical documents into vector database",
)
@limiter.limit("10/minute")
def trigger_vector_reindex(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Scans all active documents and rebuilds the persistent ChromaDB collection.
    """
    try:
        status_res = rag_service.index_all_documents(db)
        return status_res
    except Exception as e:
        logger.exception(f"Vector reindexing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rebuild vector index.",
        )
