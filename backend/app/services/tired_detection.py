# backend/services/tired_detection.py
from dataclasses import dataclass
import numpy as np

# You can plug in Mediapipe FaceMesh or Holistic here if you want.


@dataclass
class TiredDetectionResult:
    is_tired: bool
    score: float  # 0–1 (1 = extremely tired)


def detect_tired(frame: np.ndarray) -> TiredDetectionResult:
    """
    Detect tiredness for a single frame.

    Ideas for real logic:
      - Eye aspect ratio (EAR) to detect half-closed eyes
      - Yawning detection (mouth opening)
      - Dark circles / slouching (more complex)

    TODO: Replace this simple stub with your real Mediapipe/OpenCV pipeline.
    """

    # --- STUB IMPLEMENTATION ---
    # Right now, this always treats the user as "not tired"
    is_tired = False
    score = 0.0

    return TiredDetectionResult(is_tired=is_tired, score=score)
