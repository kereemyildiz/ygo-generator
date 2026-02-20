"""
Linking Wizard Routes
API endpoints for the STT-based linking wizard.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path

from services.linking_wizard import linking_wizard_manager


router = APIRouter(prefix="/api/linking-wizard", tags=["linking-wizard"])

# Upload directory (same as upload routes)
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"


# ===== Request/Response Models =====

class StartWizardRequest(BaseModel):
    """Request to start a linking wizard session."""
    stt_filename: str
    uc_filename: str


class StartWizardResponse(BaseModel):
    """Response after starting a linking wizard session."""
    session_id: str
    stt_filename: str
    uc_filename: str
    total_stt: int
    total_uc: int
    status: str


class ConfirmLinksRequest(BaseModel):
    """Request to confirm links for current STT item."""
    stt_id: str
    selected_uc_ids: List[str]


# ===== Endpoints =====

@router.post("/start", response_model=StartWizardResponse)
async def start_wizard(request: StartWizardRequest):
    """
    Start a new linking wizard session.
    Parses STT and UC files and initializes the wizard state.
    """
    stt_path = UPLOAD_DIR / request.stt_filename
    uc_path = UPLOAD_DIR / request.uc_filename

    if not stt_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"STT dosyası bulunamadı: {request.stt_filename}"
        )
    if not uc_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Senaryo dosyası bulunamadı: {request.uc_filename}"
        )

    try:
        result = linking_wizard_manager.start_session(str(stt_path), str(uc_path))
        return StartWizardResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wizard başlatılamadı: {str(e)}")


@router.get("/{session_id}/current")
async def get_current_stt(session_id: str):
    """
    Get the current STT item and progress information.
    """
    result = linking_wizard_manager.get_current_stt(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    return result


@router.get("/{session_id}/suggestions")
async def get_suggestions(session_id: str, count: int = 10):
    """
    Get mock RAG suggestions for the current STT item.
    Returns N most relevant Use Case items.
    """
    result = linking_wizard_manager.get_suggestions(session_id, count)
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı veya tamamlanmış")
    return {"suggestions": result, "count": len(result)}


@router.post("/{session_id}/confirm")
async def confirm_links(session_id: str, request: ConfirmLinksRequest):
    """
    Confirm links between current STT item and selected UC items.
    """
    result = linking_wizard_manager.confirm_links(
        session_id, request.stt_id, request.selected_uc_ids
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    return result


@router.post("/{session_id}/next")
async def next_stt(session_id: str):
    """
    Move to the next STT item.
    """
    result = linking_wizard_manager.next_stt(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    return result


@router.post("/{session_id}/skip")
async def skip_stt(session_id: str):
    """
    Skip the current STT item and move to next.
    """
    result = linking_wizard_manager.skip_stt(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    return result


@router.post("/{session_id}/prev")
async def prev_stt(session_id: str):
    """
    Go back to the previous STT item.
    """
    result = linking_wizard_manager.prev_stt(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    return result


@router.get("/{session_id}/summary")
async def get_summary(session_id: str):
    """
    Get a summary of all links created in this session.
    """
    result = linking_wizard_manager.get_summary(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    return result
