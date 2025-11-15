# backend/services/phone_detection.py
from dataclasses import dataclass
import numpy as np

# If you use a YOLO / object detection model,
# you can load it here once at import time.
# Example:
# from ultralytics import YOLO
# model = YOLO("yolov8n.pt")

PHONE_LABELS = {"cell phone", "cellphone", "mobile phone"}


@dataclass
class PhoneDetectionResult:
    phone_detected: bool
    confidence: float = 0.0


def detect_phone(frame: np.ndarray) -> PhoneDetectionResult:
    """
    Detect whether a phone is present in the frame.

    TODO: Replace with real object detection logic (YOLO, etc).
    Currently returns a stub value.
    """
    # --- STUB IMPLEMENTATION ---
    # Replace this with real detection:
    # results = model(frame)
    # parse results, check if any label in PHONE_LABELS, etc.
    phone_present = False
    confidence = 0.0

    return PhoneDetectionResult(phone_detected=phone_present, confidence=confidence)
