# backend/utils/image_utils.py
from fastapi import UploadFile
import numpy as np
import cv2


async def read_image_to_ndarray(file: UploadFile) -> np.ndarray:
    """
    Read an UploadFile as a BGR image (np.ndarray) using OpenCV.
    """
    contents = await file.read()
    np_img = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img
