# backend/app/routers/focus_score.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List,Tuple

router = APIRouter(
    prefix="/focus",
    tags=["focus-summary"],
)

# --- simple global counters (per server process) -----------------
phone_count = 0
tired_count = 0
fidgety_count = 0
focus_timeline: List[Tuple[float, float]] = []
time_counter: float = 0.0


class FocusSummary(BaseModel):
    phone: int
    tired: int
    fidgety: int
    focus_score: float
    focus_timeline: List[List[float]]


def update_focus_counters(*, phone: bool, tired: bool, fidgety: bool, focus_score: float) -> None:
    """
    Called from the WebSocket router for each processed frame.
    Increments the global counters when a condition is true.
    """
    global phone_count, tired_count, fidgety_count, focus_timeline, time_counter

    if phone:
        phone_count += 1
    if tired:
        tired_count += 1
    if fidgety:
        fidgety_count += 1

    focus_timeline.append((time_counter, focus_score))
    time_counter += 1.0 


"""
    Returns how many times phone/tired/fidgety were true overall.
    If reset=true, also clears the counters after returning them.
"""

@router.get("/summary", response_model=FocusSummary)
def get_focus_summary(reset: bool = False) -> FocusSummary:
    
    global phone_count, tired_count, fidgety_count, focus_timeline, time_counter

    #calculate average focus score
    if focus_timeline:
        avg_focus = sum(score for _, score in focus_timeline) / len(focus_timeline)
    else:
        avg_focus = 0.0

    summary = FocusSummary(
        focus_score=avg_focus,
        phone=phone_count,
        tired=tired_count,
        fidgety=fidgety_count,
        focus_timeline=[[t, s] for (t, s) in focus_timeline],  # convert tuples to lists
    )

    if reset:
        phone_count = 0
        tired_count = 0
        fidgety_count = 0
        focus_timeline = []
        time_counter = 0.0

    return summary


# @router.get("/summary", response_model=FocusSummary)
# def get_focus_summary(reset: bool = False) -> FocusSummary:
#     return FocusSummary(
#         phone=3,
#         tired=1,
#         fidgety=2,
#         focus_score=0.82,
#         focus_timeline=[[0, 0.8], [1, 0.85], [2, 0.83]]
#     )