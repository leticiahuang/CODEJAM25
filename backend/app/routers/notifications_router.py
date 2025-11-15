# backend/routers/notifications_router.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import numpy as np

from ..utils.image_utils import read_image_to_ndarray
from ..services.phone_detection import detect_phone
from ..services.tired_detection import detect_tired
from ..services.fidgety_detection import detect_fidgety

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationsResponse(BaseModel):
    tired: bool
    fidgety: bool
    phone: bool


@router.post("", response_model=NotificationsResponse)
async def post_notifications(frame: UploadFile = File(...)):
    """
    Analyze a single frame and return which notifications should be triggered:
      - tired
      - fidgety
      - phone
    """
    try:
        img = await read_image_to_ndarray(frame)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    phone_res = detect_phone(img)
    tired_res = detect_tired(img)
    fidgety_res = detect_fidgety(img)

    # For now, we map directly from the underlying booleans.
    # You can add thresholds/logic if needed.
    return NotificationsResponse(
        tired=tired_res.is_tired,
        fidgety=fidgety_res.is_fidgety,
        phone=phone_res.phone_detected,
    )
