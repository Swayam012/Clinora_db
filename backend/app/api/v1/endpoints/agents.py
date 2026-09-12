import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.agent import AgentTaskRequest, AgentTaskResponse, AgentTypeInfo
from app.services import agent_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Clinical AI Workflow Agents"])


@router.get(
    "/types",
    response_model=List[AgentTypeInfo],
    summary="List available clinical AI workflow agents",
)
@limiter.limit("60/minute")
def get_agent_types(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Returns directory of specialized clinical AI agents and capabilities."""
    return agent_service.AGENT_TYPES


@router.post(
    "/run",
    response_model=AgentTaskResponse,
    summary="Execute a specialized clinical AI agent task",
)
@limiter.limit("30/minute")
def run_agent_task(
    request: Request,
    task_in: AgentTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Executes a designated clinical workflow agent (discharge summary, drug interaction, trial match, coding)."""
    try:
        response = agent_service.execute_agent_task(db, task_in)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception(f"Agent execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clinical AI agent execution failed due to an internal error.",
        )


@router.post(
    "/discharge-summary/{patient_id}",
    response_model=AgentTaskResponse,
    summary="Quick synthesis of patient discharge summary",
)
@limiter.limit("30/minute")
def quick_discharge_summary(
    request: Request,
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Executes the Discharge Summary Synthesis Agent."""
    try:
        return agent_service.run_discharge_summary_agent(db, patient_id)
    except Exception as e:
        logger.exception(f"Discharge agent failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Discharge summary generation failed.")


@router.post(
    "/drug-interaction/{patient_id}",
    response_model=AgentTaskResponse,
    summary="Quick audit of patient drug-drug interactions and contraindications",
)
@limiter.limit("30/minute")
def quick_drug_interaction(
    request: Request,
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Executes the Drug-Drug Interaction Safety Agent."""
    try:
        return agent_service.run_drug_interaction_agent(db, patient_id)
    except Exception as e:
        logger.exception(f"Drug interaction agent failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Drug interaction analysis failed.")


@router.post(
    "/trial-match/{patient_id}",
    response_model=AgentTaskResponse,
    summary="Quick matching of clinical trials for patient biomarkers",
)
@limiter.limit("30/minute")
def quick_trial_match(
    request: Request,
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Executes the Precision Clinical Trial Matching Agent."""
    try:
        return agent_service.run_clinical_trial_agent(db, patient_id)
    except Exception as e:
        logger.exception(f"Trial match agent failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Clinical trial matching failed.")
