"""
Pydantic schemas for Phase 10: Complete Analytics Dashboard & Clinical Insights Reporting.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class StatItem(BaseModel):
    label: str
    value: str
    trend: Optional[str] = None
    trend_up: Optional[bool] = None
    color: str = "purple"
    subtext: Optional[str] = None


class DiagnosisDistributionItem(BaseModel):
    name: str
    icd10: Optional[str] = None
    count: int
    pct: float
    category: Optional[str] = "General"


class DocumentTypeDistributionItem(BaseModel):
    document_type: str
    count: int
    pct: float
    color: str = "purple"


class OcrTelemetryItem(BaseModel):
    engine: str
    processed_count: int
    avg_confidence: float
    avg_latency_ms: float
    accuracy_rate: float


class AnalyticsSummaryResponse(BaseModel):
    total_patients: int
    active_patients: int
    total_documents: int
    processed_documents: int
    pending_documents: int
    total_entities_extracted: int
    ocr_success_rate: float
    avg_extraction_latency_ms: float
    rag_queries_answered: int
    vector_index_size: int
    storage_used_mb: float
    stats_cards: List[StatItem]
    recent_activity: List[Dict[str, Any]] = []


class AnalyticsDiagnosesResponse(BaseModel):
    total_diagnoses_recorded: int
    cohorts: List[DiagnosisDistributionItem]


class AnalyticsTelemetryResponse(BaseModel):
    document_distribution: List[DocumentTypeDistributionItem]
    ocr_telemetry: List[OcrTelemetryItem]
    total_storage_mb: float
    avg_pipeline_latency_ms: float
    system_status: str = "Operational"


class HospitalReportExportResponse(BaseModel):
    facility_name: str = "Clinora University Health System"
    report_timestamp: str
    summary: AnalyticsSummaryResponse
    diagnoses: List[DiagnosisDistributionItem]
    document_distribution: List[DocumentTypeDistributionItem]
    telemetry: List[OcrTelemetryItem]
    executive_narrative: str
