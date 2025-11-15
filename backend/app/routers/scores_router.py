# backend/routers/scores_router.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from ..utils.image_utils import read_image_to_ndarray
from ..services.focus_score_calculator import calculate_focus_score

router = APIRouter(prefix="/scores", tags=["scores"])


class FocusScoreResponse(BaseModel):
    focus_score: float
    is_focused: bool
    tired_score: float
    fidgety_score: float
    phone_detected: bool


@router.post("", response_model=FocusScoreResponse)
async def post_score(frame: UploadFile = File(...)):
    """
    Analyze a single frame and return the focus score and components.
    """
    try:
        img = await read_image_to_ndarray(frame)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    res = calculate_focus_score(img)

    return FocusScoreResponse(
        focus_score=res.focus_score,
        is_focused=res.is_focused,
        tired_score=res.tired.score,
        fidgety_score=res.fidgety.movement_score,
        phone_detected=res.phone.phone_detected,
    )
