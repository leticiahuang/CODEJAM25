# backend/services/focus_score_calculator.py
from dataclasses import dataclass
import numpy as np

from .phone_detection import detect_phone, PhoneDetectionResult
from .tired_detection import detect_tired, TiredDetectionResult
from .fidgety_detection import detect_fidgety, FidgetyDetectionResult


@dataclass
class FocusScoreResult:
    focus_score: float     # 0–1
    is_focused: bool
    phone: PhoneDetectionResult
    tired: TiredDetectionResult
    fidgety: FidgetyDetectionResult


def calculate_focus_score(frame: np.ndarray) -> FocusScoreResult:
    """
    Use phone, tired, and fidgety signals to compute a focus score for this frame.

    This is just one example weighting. You can adjust the formula.
    """
    phone_res = detect_phone(frame)
    tired_res = detect_tired(frame)
    fidgety_res = detect_fidgety(frame)

    # Start from perfect focus = 1.0
    score = 1.0

    # Subtract penalties
    if phone_res.phone_detected:
        score -= 0.5  # Big penalty for phone
    score -= 0.3 * tired_res.score
    score -= 0.2 * fidgety_res.movement_score

    # Clip to [0, 1]
    score = max(0.0, min(1.0, score))

    # Decide a binary focus flag (you can tune this threshold)
    is_focused = score >= 0.6

    return FocusScoreResult(
        focus_score=score,
        is_focused=is_focused,
        phone=phone_res,
        tired=tired_res,
        fidgety=fidgety_res,
    )