# backend/app/routers/focus_score.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/focus",
    tags=["focus-summary"],
)

# --- simple global counters (per server process) -----------------
phone_count = 0
tired_count = 0
fidgety_count = 0


class FocusSummary(BaseModel):
    phone: int
    tired: int
    fidgety: int


def update_focus_counters(*, phone: bool, tired: bool, fidgety: bool) -> None:
    """
    Called from the WebSocket router for each processed frame.
    Increments the global counters when a condition is true.
    """
    global phone_count, tired_count, fidgety_count

    if phone:
        phone_count += 1
    if tired:
        tired_count += 1
    if fidgety:
        fidgety_count += 1


@router.get("/summary", response_model=FocusSummary)
def get_focus_summary(reset: bool = False) -> FocusSummary:
    """
    Returns how many times phone/tired/fidgety were true overall.
    If reset=true, also clears the counters after returning them.
    """
    global phone_count, tired_count, fidgety_count

    summary = FocusSummary(
        phone=phone_count,
        tired=tired_count,
        fidgety=fidgety_count,
    )

    if reset:
        phone_count = 0
        tired_count = 0
        fidgety_count = 0

    return summary
