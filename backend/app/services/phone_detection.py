# backend/services/phone_detection.py
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple, Union

import cv2
import numpy as np

# Labels in the COCO dataset that correspond to phones
PHONE_LABELS = {"cell phone", "cellphone", "mobile phone"}


@dataclass
class PhoneDetectionResult:
    phone_detected: bool
    confidence: float = 0.0


# ---------------- YOLO MODEL LOADING (from your old init_phone_detector) ---------------- #

# We’ll load YOLOv3-tiny once at module import.
# Assumes the following files are in the backend/ directory:
#   - yolov3-tiny.weights
#   - yolov3-tiny.cfg
#   - coco.names
_BACKEND_ROOT = Path(__file__).resolve().parent.parent

_WEIGHTS_PATH = _BACKEND_ROOT / "yolov3-tiny.weights"
_CONFIG_PATH = _BACKEND_ROOT / "yolov3-tiny.cfg"
_NAMES_PATH = _BACKEND_ROOT / "coco.names"

_yolo_net: Optional[cv2.dnn_DetectionModel] = None
_class_names: List[str] = []


def _load_yolo_model_if_needed() -> None:
    global _yolo_net, _class_names

    if _yolo_net is not None and _class_names:
        return

    if not (_WEIGHTS_PATH.exists() and _CONFIG_PATH.exists() and _NAMES_PATH.exists()):
        # If any file is missing, just leave the model as None
        # (detection will always return no phone).
        print("[phone_detection] YOLO files not found, phone detection disabled.")
        _yolo_net = None
        _class_names = []
        return

    net = cv2.dnn_DetectionModel(str(_WEIGHTS_PATH), str(_CONFIG_PATH))
    net.setInputSize(320, 320)
    net.setInputScale(1.0 / 255)
    net.setInputSwapRB(True)

    with open(_NAMES_PATH, "r") as f:
        class_names = [c.strip() for c in f.readlines()]

    _yolo_net = net
    _class_names = class_names
    print("[phone_detection] YOLOv3-tiny model loaded.")


# ---------------- DETECTION FUNCTION (port of your detect_phone) ---------------- #

def detect_phone(frame: np.ndarray) -> PhoneDetectionResult:
    """
    Return whether a phone is detected in the frame using YOLOv3-tiny.

    This is a direct port of your old Streamlit-based `detect_phone` function,
    but with the model stored as a module-global instead of in st.session_state.
    """
    _load_yolo_model_if_needed()

    if _yolo_net is None or not _class_names:
        return PhoneDetectionResult(phone_detected=False, confidence=0.0)

    net = _yolo_net
    class_names = _class_names

    # Upscale the frame so small objects (like a phone low in the frame) appear larger
    bigger = cv2.resize(frame, None, fx=1.5, fy=1.5)

    # Slightly lower confThreshold for more sensitivity (from your old code)
    class_ids, confidences, boxes = net.detect(
        bigger, confThreshold=0.25, nmsThreshold=0.4
    )

    # Some OpenCV builds return None or empty tuples/lists when nothing is detected
    if class_ids is None:
        return PhoneDetectionResult(phone_detected=False, confidence=0.0)
    if isinstance(class_ids, (tuple, list)) and len(class_ids) == 0:
        return PhoneDetectionResult(phone_detected=False, confidence=0.0)

    # Track the best confidence among any "phone" detections
    best_phone_conf = 0.0
    num_dets = len(boxes)

    for i in range(num_dets):
        cid = class_ids[i]
        conf = float(confidences[i])

        # class id might be [[id]] or [id] or np.array([...])
        if isinstance(cid, (list, tuple)):
            cid = cid[0]
        try:
            cid_int = int(cid)
        except (TypeError, ValueError):
            continue

        if cid_int < 0 or cid_int >= len(class_names):
            continue

        label = class_names[cid_int]
        if label in PHONE_LABELS:
            if conf > best_phone_conf:
                best_phone_conf = conf

    if best_phone_conf > 0.0:
        return PhoneDetectionResult(phone_detected=True, confidence=best_phone_conf)

    return PhoneDetectionResult(phone_detected=False, confidence=0.0)
