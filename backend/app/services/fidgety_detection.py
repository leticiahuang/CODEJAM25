# backend/services/fidgety_detection.py
from dataclasses import dataclass
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

from body_language import BodyLanguageAnalyzer  # your existing class


@dataclass
class FidgetyDetectionResult:
    is_fidgety: bool
    movement_score: float  # 0–1 (1 = very fidgety)


# ---------- GLOBAL ANALYZER + MEDIAPIPE HOLISTIC (stateful) ---------- #

# This analyzer keeps state across frames (hand velocity history, etc.)
_analyzer = BodyLanguageAnalyzer()

_mp_holistic = mp.solutions.holistic
_holistic = _mp_holistic.Holistic(
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    refine_face_landmarks=True,
)


def detect_fidgety(frame: np.ndarray) -> FidgetyDetectionResult:
    """
    Detect whether the person looks fidgety in this frame.

    Uses the same logic as your old Streamlit app:

        feedback = analyzer.get_feedback()
        hand_feedback = feedback["hand_gestures"]["feedback"]
        if hand_feedback.lower().startswith("slow down"):
            fidget_now = True

    We also expose a movement_score in [0, 1], where higher = more fidgety.
    This is derived from your hand_gestures score (good gesture %).
    """
    img_h, img_w = frame.shape[:2]

    # MediaPipe expects RGB
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = _holistic.process(frame_rgb)

    # Update analyzer with new frame
    _analyzer.update(results, img_h, img_w)
    feedback = _analyzer.get_feedback()

    # Defaults
    is_fidgety = False
    movement_score = 0.0

    if feedback and "hand_gestures" in feedback:
        hand_info = feedback["hand_gestures"]
        hand_feedback = hand_info.get("feedback", "")
        score_pct = float(hand_info.get("score", 0.0))  # 0–100, % of "good" gestures

        # Invert the "good gestures %" into a fidgetiness score:
        #   high good%  → low fidgety
        #   low good%   → high fidgety
        # clamp to [0,1]
        movement_score = 1.0 - max(0.0, min(1.0, score_pct / 100.0))

        # Your original trigger: "Slow down hand gestures!"
        if isinstance(hand_feedback, str) and hand_feedback.lower().startswith("slow down"):
            is_fidgety = True

            # Ensure fidgety cases get a noticeably high movement_score
            if movement_score < 0.7:
                movement_score = 0.7

    return FidgetyDetectionResult(
        is_fidgety=is_fidgety,
        movement_score=float(movement_score),
    )
