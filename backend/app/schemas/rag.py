"""
CLINORA — Clinical RAG & Semantic Search Schemas (Phase 7)

Defines request/response schemas for:
  - Natural Language Clinical Q&A
  - Semantic Document Search
  - Source Document Citations
  - Vector Index Management
"""

import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000, description="Natural language clinical question")
    patient_id: Optional[uuid.UUID] = Field(None, description="Filter search to a specific patient UUID")
    top_k: int = Field(4, ge=1, le=15, description="Number of source document chunks to retrieve")


class CitationItem(BaseModel):
    document_id: uuid.UUID = Field(..., description="Source document UUID")
    document_title: str = Field(..., description="Document label/title")
    patient_name: Optional[str] = Field(None, description="Patient full name")
    patient_id: Optional[str] = Field(None, description="Medical Record / Patient ID string")
    document_type: Optional[str] = Field(None, description="e.g. prescription, lab_report, clinical_note")
    excerpt: str = Field(..., description="Relevant clinical text snippet retrieved from document")
    similarity_score: float = Field(..., description="Vector similarity score (0.0 to 1.0)")


class RAGQueryResponse(BaseModel):
    query: str = Field(..., description="Original clinical question")
    answer: str = Field(..., description="Synthesized medical response grounded in retrieved documents")
    citations: List[CitationItem] = Field(default_factory=list, description="Ground-truth source document citations")
    model_used: str = Field(..., description="LLM / reasoning engine used for answer generation")
    confidence: Optional[str] = Field("High", description="Answer grounding confidence")


class SemanticSearchResult(BaseModel):
    query: str = Field(..., description="Search query")
    results: List[CitationItem] = Field(default_factory=list, description="Ranked matching document excerpts")
    total_found: int = Field(0, description="Count of relevant results")


class IndexStatusResponse(BaseModel):
    indexed_documents: int = Field(..., description="Number of active clinical documents indexed")
    total_chunks: int = Field(..., description="Total vector embedding chunks stored")
    status: str = Field(default="ready", description="Vector index status")
