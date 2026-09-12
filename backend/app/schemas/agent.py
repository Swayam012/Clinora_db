from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class AgentTaskRequest(BaseModel):
    """Request payload to execute a clinical AI agent task."""
    agent_type: str = Field(..., description="discharge_summary, drug_interaction, clinical_trial, medical_coding")
    patient_id: str = Field(..., description="Target Patient UUID or demo MRN identifier")
    document_id: Optional[str] = Field(None, description="Optional specific document UUID context")
    custom_prompt: Optional[str] = Field(None, description="Optional clinician instructions or parameters")


class DrugInteractionItem(BaseModel):
    """Details of a single identified drug-drug interaction."""
    drug_a: str
    drug_b: str
    severity: str = Field(..., description="Major, Moderate, Minor")
    effect: str = Field(..., description="Description of the clinical pharmacokinetic effect")
    recommendation: str = Field(..., description="Clinician action / monitoring guidance")


class TrialMatchItem(BaseModel):
    """Clinical trial protocol recommendation matching patient biomarkers."""
    nct_id: str
    title: str
    phase: str
    sponsor: str
    match_score: int = Field(..., ge=0, le=100, description="Match score percentage")
    criteria_met: List[str]
    target_biomarkers: List[str]
    enrollment_status: str


class MedicalCodeItem(BaseModel):
    """ICD-10 or CPT code recommended by the coding agent."""
    code: str
    description: str
    type: str = Field(..., description="ICD-10-CM or CPT")
    confidence: int = Field(..., ge=0, le=100)
    justification: str


class AgentTaskResponse(BaseModel):
    """Result payload produced by a clinical agent."""
    task_id: str
    agent_type: str
    patient_id: str
    patient_name: str
    status: str = "completed"
    title: str
    executive_summary: str
    risk_level: str = Field(default="Normal", description="High, Medium, Low, Normal")
    key_findings: List[str] = []
    structured_data: Dict[str, Any] = {}
    interactions: List[DrugInteractionItem] = []
    trials: List[TrialMatchItem] = []
    codes: List[MedicalCodeItem] = []
    recommendations: List[str] = []
    citations: List[Dict[str, Any]] = []
    model_used: str = "clinora-clinical-agent-v1"
    timestamp: str


class AgentTypeInfo(BaseModel):
    """Metadata describing an available clinical agent."""
    id: str
    name: str
    description: str
    icon: str
    category: str
    capabilities: List[str]
