# app/routers/focus_ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import numpy as np
import base64
import json

from ..services.phone_detection import detect_phone
from ..services.tired_detection import detect_tired
from ..services.fidgety_detection import detect_fidgety
from ..services.focus_score_calculator import calculate_focus_score
from ..routers.focus_score import update_focus_counters



router = APIRouter()


def detect_focus(frame: np.ndarray):
    """
    Run all 3 detectors + focus score on a single frame.
    Returns a plain dict that can be sent over WebSocket as JSON.
    """
    phone_res = detect_phone(frame)
    tired_res = detect_tired(frame)
    fidgety_res = detect_fidgety(frame)
    focus_res = calculate_focus_score(frame)

    return {
        "type": "focus_result",

        # Notifications 
        "phone": phone_res.phone_detected,
        "phone_confidence": phone_res.confidence,

        "tired": tired_res.is_tired,
        "tired_score": tired_res.score,  # 0–1

        "fidgety": fidgety_res.is_fidgety,
        "fidgety_score": fidgety_res.movement_score,  # 0–1

        #  overall focus info
        "focus_score": focus_res.focus_score,  # 0–1
        "is_focused": focus_res.is_focused,
    }
    


@router.websocket("/ws/focus")
async def websocket_focus(websocket: WebSocket):
    # Accept the WebSocket connection
    await websocket.accept()
    print("Client connected to /ws/focus")
    

    try:
        while True:
            # Wait for a text message from the client
            msg = await websocket.receive_text()

            # Expect JSON like: { "type": "frame", "image": "<base64>" }
            try:
                data = json.loads(msg)
            except json.JSONDecodeError:
                print("Received non-JSON message")
                continue

            if data.get("type") != "frame":
                # Ignore unknown message types
                continue

            base64_image = data.get("image")
            if not base64_image:
                continue

            try:
                # Decode base64 -> bytes -> np array -> OpenCV image
                img_bytes = base64.b64decode(base64_image)
                np_img = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

                ###NOW: RETURN THE OPENCV FOCUS DETECTION RESULT
                json_response = detect_focus(frame)

                # storing stats for the final session stats
                update_focus_counters(
                    phone=json_response["phone"],
                    tired=json_response["tired"],
                    fidgety=json_response["fidgety"],
                    focus_score=json_response["focus_score"],
                )

                # Send result back to client
                await websocket.send_json(json_response)

            except Exception as e:
                print(f"Error processing frame: {e}")

    except WebSocketDisconnect:
        print("Client disconnected from /ws/focus")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


