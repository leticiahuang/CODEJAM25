# backend/services/tired_detection.py
from dataclasses import dataclass
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

from body_language import BodyLanguageAnalyzer  # your existing class


@dataclass
class TiredDetectionResult:
    is_tired: bool
    score: float  # 0–1 (1 = extremely tired)


# ---------- GLOBAL ANALYZER + MEDIAPIPE HOLISTIC (stateful, like your old app) ---------- #

# We keep one BodyLanguageAnalyzer and one Holistic model for the whole process.
# This allows blink_rate and eye_closed_frames to accumulate across frames.
_analyzer = BodyLanguageAnalyzer()

_mp_holistic = mp.solutions.holistic
_holistic = _mp_holistic.Holistic(
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    refine_face_landmarks=True,
)


def detect_tired(frame: np.ndarray) -> TiredDetectionResult:
    """
    Detect tiredness for a single frame, using your old logic:

        long_closure = analyzer.eye_closed_frames >= 30  # ~1–1.5 seconds
        very_high_blink_rate = blink_rate > 40.0
        is_tired = long_closure or very_high_blink_rate

    We also return a simple 0–1 score:
      - 1.0 if tired by either condition
      - 0.0 otherwise
    """
    img_h, img_w = frame.shape[:2]

    # MediaPipe expects RGB
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = _holistic.process(frame_rgb)

    # Update your existing analyzer with the new frame
    _analyzer.update(results, img_h, img_w)
    feedback = _analyzer.get_feedback()

    # Default: not tired
    is_tired = False
    score = 0.0

    if feedback:
        # Same variables 
        blink_rate = feedback["blink_rate"]["rate"]
        long_closure = _analyzer.eye_closed_frames >= 30  # ~1–1.5 seconds
        very_high_blink_rate = blink_rate > 40.0

        if long_closure or very_high_blink_rate:
            is_tired = True
            # Simple mapping: if either condition hits, treat as fully tired
            score = 1.0
        else:
            # If you want something more graded, you can tune this block.
            score = 0.0

    return TiredDetectionResult(is_tired=is_tired, score=score)
