"""
API Router for Phase 10: Complete Analytics Dashboard & Clinical Insights Reporting.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    AnalyticsDiagnosesResponse,
    AnalyticsTelemetryResponse,
    HospitalReportExportResponse,
)
from app.services.analytics_service import (
    get_analytics_summary,
    get_diagnoses_distribution,
    get_telemetry_metrics,
    generate_hospital_report,
)

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def read_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch live platform KPIs, document counts, and clinical telemetry summary.
    """
    return get_analytics_summary(db)


@router.get("/diagnoses", response_model=AnalyticsDiagnosesResponse)
def read_diagnoses_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch diagnostic distribution across ICD-10 disease cohorts.
    """
    return get_diagnoses_distribution(db)


@router.get("/telemetry", response_model=AnalyticsTelemetryResponse)
def read_telemetry_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch OCR performance benchmarks and document ingestion pipeline distribution.
    """
    return get_telemetry_metrics(db)


@router.get("/export", response_model=HospitalReportExportResponse)
def export_hospital_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export comprehensive hospital clinical intelligence report.
    """
    return generate_hospital_report(db)
