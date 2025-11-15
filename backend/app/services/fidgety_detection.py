# backend/services/fidgety_detection.py
from dataclasses import dataclass
import numpy as np

# For “fidgety”, you can use Mediapipe pose/hands and track
# how much the keypoints move between frames.
# Since this endpoint is frame-by-frame, you can still store
# a small history in memory keyed by a session_id if you want.
# Here we keep it per-frame only as a stub.


@dataclass
class FidgetyDetectionResult:
    is_fidgety: bool
    movement_score: float  # 0–1 (1 = very fidgety)


def detect_fidgety(frame: np.ndarray) -> FidgetyDetectionResult:
    """
    Detect whether the person looks fidgety in this frame.

    Real logic could be:
      - Measure hand/upper body keypoint velocities
      - Compare to a threshold

    TODO: Replace stub with your true motion analysis.
    """

    # --- STUB IMPLEMENTATION ---
    is_fidgety = False
    movement_score = 0.0

    return FidgetyDetectionResult(is_fidgety=is_fidgety, movement_score=movement_score)
