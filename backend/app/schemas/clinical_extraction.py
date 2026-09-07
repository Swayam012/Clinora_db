"""
CLINORA — Clinical Information Extraction Schemas (Phase 6)

Defines structured Pydantic models for medical entities extracted from OCR text:
  - Patient Demographics & Identification
  - Vitals & Clinical Measurements
  - Chief Symptoms & Onset Timeline
  - Diagnoses & ICD-10 Coding
  - Prescribed Medications & Dosages
  - Laboratory Test Results with Status Flags
  - Allergies & Contraindications
  - Clinical Summary & Recommendations
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class DemographicsData(BaseModel):
    patient_name: Optional[str] = Field(None, description="Extracted patient full name")
    age: Optional[str] = Field(None, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")
    dob: Optional[str] = Field(None, description="Date of birth")
    patient_id: Optional[str] = Field(None, description="Medical Record Number / Patient ID")
    physician_name: Optional[str] = Field(None, description="Attending or referring physician")
    report_date: Optional[str] = Field(None, description="Date of clinical note / report")
    specialty: Optional[str] = Field(None, description="Medical specialty (e.g. Cardiology, Endocrinology)")


class VitalsData(BaseModel):
    blood_pressure: Optional[str] = Field(None, description="e.g. 138/88 mmHg")
    heart_rate: Optional[str] = Field(None, description="e.g. 78 bpm")
    respiratory_rate: Optional[str] = Field(None, description="e.g. 16 breaths/min")
    temperature: Optional[str] = Field(None, description="e.g. 98.6 °F or 37 °C")
    oxygen_saturation: Optional[str] = Field(None, description="e.g. 98% on room air")
    weight: Optional[str] = Field(None, description="e.g. 68 kg")
    height: Optional[str] = Field(None, description="e.g. 172 cm")
    bmi: Optional[str] = Field(None, description="e.g. 23.0 kg/m²")


class SymptomItem(BaseModel):
    symptom: str = Field(..., description="Name of presenting complaint or symptom")
    onset: Optional[str] = Field(None, description="When the symptom started (e.g. 2 months ago)")
    duration: Optional[str] = Field(None, description="Duration or frequency (e.g. intermittent, episodic)")
    severity: Optional[str] = Field(None, description="Mild, Moderate, Severe")


class DiagnosisItem(BaseModel):
    condition: str = Field(..., description="Diagnosed clinical condition or finding")
    icd10_code: Optional[str] = Field(None, description="Suggested or stated ICD-10 code (e.g. I10, I20.9)")
    type: str = Field(
        default="primary",
        description="primary, secondary, or differential",
    )
    confidence: Optional[str] = Field("High", description="Extraction confidence score")


class MedicationItem(BaseModel):
    drug_name: str = Field(..., description="Generic or brand pharmaceutical name")
    dosage: Optional[str] = Field(None, description="Strength (e.g. 50mg, 10mg/5ml)")
    frequency: Optional[str] = Field(None, description="Schedule (e.g. Once daily, Twice daily after meals)")
    route: Optional[str] = Field(None, description="Oral, IV, Topical, Inhalation")
    duration: Optional[str] = Field(None, description="Duration of prescription (e.g. 30 days, ongoing)")
    instructions: Optional[str] = Field(None, description="Special instructions or precautions")


class LabResultItem(BaseModel):
    test_name: str = Field(..., description="Laboratory test or biomarker name")
    value: str = Field(..., description="Observed quantitative or qualitative result")
    unit: Optional[str] = Field(None, description="Measurement unit (e.g. mg/dL, mmol/L, %)")
    reference_range: Optional[str] = Field(None, description="Normal baseline range (e.g. 70-99 mg/dL)")
    flag: str = Field(
        default="normal",
        description="normal, high, low, or critical",
    )


class AllergyItem(BaseModel):
    allergen: str = Field(..., description="Substance or medication (e.g. Penicillin, Peanuts)")
    reaction: Optional[str] = Field(None, description="Observed reaction (e.g. Rash, Anaphylaxis)")
    severity: Optional[str] = Field(None, description="Mild, Moderate, Severe")


class ClinicalExtractionResult(BaseModel):
    """
    Complete structured clinical dataset extracted from medical documents.
    """
    demographics: DemographicsData = Field(default_factory=DemographicsData)
    vitals: VitalsData = Field(default_factory=VitalsData)
    symptoms: List[SymptomItem] = Field(default_factory=list)
    diagnoses: List[DiagnosisItem] = Field(default_factory=list)
    medications: List[MedicationItem] = Field(default_factory=list)
    lab_results: List[LabResultItem] = Field(default_factory=list)
    allergies: List[AllergyItem] = Field(default_factory=list)
    clinical_summary: str = Field(
        default="",
        description="Concise executive medical summary for attending clinicians",
    )
    follow_up_recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable follow-up steps, lifestyle changes, or ordered tests",
    )
    extraction_source: str = Field(
        default="gemini-llm",
        description="Engine used for extraction (gemini-llm or heuristic-parser)",
    )
