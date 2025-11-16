import time
from collections import deque

import cv2
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_holistic = mp.solutions.holistic

# ------------------------ Gesture & blink tuning ------------------------

# Controls how quickly hand speed reacts to changes (0–1)
HAND_VEL_SMOOTHING = 0.3

# Below this normalized speed we treat the hand as basically still
HAND_VEL_IDLE_THRESHOLD = 0.05

# “Healthy” motion band – not frozen, not flailing
HAND_VEL_GOOD_MIN = 0.1
HAND_VEL_GOOD_MAX = 0.8

# Above this normalized speed we consider gesture intensity too high
HAND_VEL_OVERACTIVE_THRESHOLD = 1.2

# Seconds of history used to summarize hand behaviour
HAND_ACTIVITY_WINDOW_S = 10.0


class FaceStateCalculator:
    """
    Tracks blink behaviour and hand movement intensity based on MediaPipe
    holistic output.

    External code relies on:
      - BodyLanguageAnalyzer(...)
      - update(results, img_h, img_w)
      - get_feedback()
      - attributes: blink_total, eye_closed_frames
      - get_feedback()["blink_rate"]["rate"]
      - get_feedback()["hand_gestures"]["score" / "feedback"]
    """

    def __init__(self):
        # Blink tracking
        self.blink_total = 0
        self.eye_closed_frames = 0
        self.total_frames = 0
        self.start_time = time.time()

        # Per-hand state (left / right)
        self._hand_state = {
            "left": {"prev_xy": None, "smoothed_speed": 0.0, "prev_t": None},
            "right": {"prev_xy": None, "smoothed_speed": 0.0, "prev_t": None},
        }

        # Short-term history of hand behaviour
        self._good_band_history = deque(maxlen=300)  # (timestamp, 0/1)
        self._speed_history = deque(maxlen=300)      # (timestamp, speed)

        # Cached summaries
        self._latest_hand_score = 0.0   # 0–100
        self._latest_mean_speed = 0.0   # normalized speed

    # ------------------------ Small utilities ------------------------

    def _current_time(self) -> float:
        """Return current time in seconds (used for windowing)."""
        return time.time()

    # ------------------------ Eye / blink helpers ------------------------

    def _eye_aspect_ratio(self, eye_points: np.ndarray) -> float:
        """
        Simple EAR-like ratio from 6 eye landmarks.
        Smaller values correspond to a more closed eye.
        """
        vertical_1 = np.linalg.norm(eye_points[1] - eye_points[5])
        vertical_2 = np.linalg.norm(eye_points[2] - eye_points[4])
        horizontal = np.linalg.norm(eye_points[0] - eye_points[3])

        if horizontal <= 1e-6:
            return 0.0

        return (vertical_1 + vertical_2) / (2.0 * horizontal)

    # ------------------------ Hand scale & history helpers ------------------------

    def _body_scale_from_landmarks(self, results, img_w: int, img_h: int) -> float:
        """
        Compute a reference size in pixels to normalize motion:
        prefer shoulder span, then face width, otherwise use image width.
        """
        # Shoulder distance as main reference
        if results and results.pose_landmarks:
            pose = results.pose_landmarks.landmark
            left_sh = pose[mp_holistic.PoseLandmark.LEFT_SHOULDER.value]
            right_sh = pose[mp_holistic.PoseLandmark.RIGHT_SHOULDER.value]

            left_xy = np.array([left_sh.x * img_w, left_sh.y * img_h], dtype=float)
            right_xy = np.array([right_sh.x * img_w, right_sh.y * img_h], dtype=float)
            shoulder_span = float(np.linalg.norm(right_xy - left_xy))

            if shoulder_span > 1.0:
                return shoulder_span

        # Fallback: approximate face width
        if results and results.face_landmarks:
            face = results.face_landmarks.landmark
            left_face = face[33]
            right_face = face[263]

            left_xy = np.array([left_face.x * img_w, left_face.y * img_h], dtype=float)
            right_xy = np.array([right_face.x * img_w, right_face.y * img_h], dtype=float)
            face_span = float(np.linalg.norm(right_xy - left_xy))

            if face_span > 1.0:
                return face_span

        # Final fallback: entire frame width
        return float(img_w)

    def _prune_time_series(self, history: deque, window_seconds: float) -> None:
        """Remove samples older than the given time horizon."""
        now_t = self._current_time()
        while history and (now_t - history[0][0] > window_seconds):
            history.popleft()

    # ------------------------ Hand velocity core ------------------------

    def _update_hand_speed_for_side(
        self,
        side_key: str,
        wrist_xy: np.ndarray,
        ref_scale_px: float,
        t_now: float,
    ):
        """
        Update smoothed normalized speed for a single hand (left or right).
        """
        state = self._hand_state[side_key]
        prev_xy = state["prev_xy"]
        prev_t = state["prev_t"]

        state["prev_xy"] = wrist_xy
        state["prev_t"] = t_now

        if prev_xy is None or prev_t is None:
            return None

        dt = max(t_now - prev_t, 1e-6)
        raw_speed = float(np.linalg.norm(wrist_xy - prev_xy) / dt)
        norm_speed = raw_speed / max(ref_scale_px, 1.0)

        # Clamp wild spikes that usually come from landmark jitter
        norm_speed = float(np.clip(norm_speed, 0.0, 5.0))

        if norm_speed < HAND_VEL_IDLE_THRESHOLD:
            norm_speed = 0.0

        smoothed = (
            (1.0 - HAND_VEL_SMOOTHING) * state["smoothed_speed"]
            + HAND_VEL_SMOOTHING * norm_speed
        )
        state["smoothed_speed"] = smoothed
        return smoothed

    def _refresh_hand_activity(self, results, img_w: int, img_h: int) -> None:
        """
        Combine both hands into a single motion score and keep a
        recent-time summary of “good” vs “too little/too much” activity.
        """
        ref_scale = self._body_scale_from_landmarks(results, img_w, img_h)
        now_t = self._current_time()

        speeds_this_frame = []

        for label, hand_landmarks in (
            ("left", getattr(results, "left_hand_landmarks", None)),
            ("right", getattr(results, "right_hand_landmarks", None)),
        ):
            if hand_landmarks:
                wrist = hand_landmarks.landmark[0]
                wrist_xy = np.array([wrist.x * img_w, wrist.y * img_h], dtype=float)
                spd = self._update_hand_speed_for_side(label, wrist_xy, ref_scale, now_t)
                if spd is not None:
                    speeds_this_frame.append(spd)

        avg_speed = float(np.mean(speeds_this_frame)) if speeds_this_frame else 0.0

        in_good_band = HAND_VEL_GOOD_MIN <= avg_speed <= HAND_VEL_GOOD_MAX
        self._good_band_history.append((now_t, int(in_good_band)))
        self._speed_history.append((now_t, avg_speed))

        # Remove old samples outside the rolling window
        self._prune_time_series(self._good_band_history, HAND_ACTIVITY_WINDOW_S)
        self._prune_time_series(self._speed_history, HAND_ACTIVITY_WINDOW_S)

        if self._good_band_history:
            avg_flag = np.mean([flag for _, flag in self._good_band_history])
        else:
            avg_flag = 0.0

        self._latest_hand_score = float(avg_flag * 100.0)
        self._latest_mean_speed = avg_speed

    # ------------------------ Main per-frame entry ------------------------

    def update(self, results, img_h: int, img_w: int) -> None:
        """
        Process one MediaPipe holistic result and update blink + gesture metrics.

        Signature must stay the same: other modules call update(results, img_h, img_w).
        """
        self.total_frames += 1

        # ----- Eyes & blinking -----
        if results.face_landmarks:
            face_lm = results.face_landmarks.landmark

            left_eye_indices = [33, 160, 158, 133, 153, 144]
            right_eye_indices = [362, 385, 387, 263, 373, 380]

            left_eye_pts = np.array(
                [[face_lm[i].x * img_w, face_lm[i].y * img_h] for i in left_eye_indices],
                dtype=float,
            )
            right_eye_pts = np.array(
                [[face_lm[i].x * img_w, face_lm[i].y * img_h] for i in right_eye_indices],
                dtype=float,
            )

            ear_left = self._eye_aspect_ratio(left_eye_pts)
            ear_right = self._eye_aspect_ratio(right_eye_pts)
            ear_avg = (ear_left + ear_right) / 2.0

            # Stricter blink logic: require several consecutive closed frames
            if ear_avg < 0.2:
                self.eye_closed_frames += 1
            else:
                if self.eye_closed_frames >= 3:
                    self.blink_total += 1
                self.eye_closed_frames = 0

        # ----- Hands & gestures -----
        self._refresh_hand_activity(results, img_w, img_h)

    # ------------------------ Public summary API ------------------------

    def get_feedback(self):
        """
        Provide a dictionary summary used by tired_detection and
        fidgety_detection. Keys and structure are kept stable on purpose.
        """
        if self.total_frames == 0:
            return {}

        elapsed_min = (time.time() - self.start_time) / 60.0
        blink_rate = self.blink_total / elapsed_min if elapsed_min > 0 else 0.0

        # Interpret hand intensity
        overactive_hands = self._latest_mean_speed >= HAND_VEL_OVERACTIVE_THRESHOLD
        hand_color = (0, 0, 255) if overactive_hands else (0, 255, 0)
        hand_msg = (
            "Hand gestures are a bit too energetic"
            if overactive_hands
            else "Hand movement looks controlled"
        )

        hand_block = {
            "score": self._latest_hand_score,  # 0–100
            "feedback": hand_msg,
            "color": hand_color,
        }

        # Interpret blink rate with a few broad bands
        if 5 <= blink_rate <= 30:
            blink_msg = "Blinking at a natural rate"
            blink_color = (0, 255, 0)
        elif blink_rate > 30:
            blink_msg = "You may be blinking a bit too often"
            blink_color = (0, 0, 255)
        else:
            # Very low rate or very little data so far
            if elapsed_min < 0.2:
                blink_msg = "Still gathering blink information..."
            else:
                blink_msg = "Try to blink a bit more to avoid eye strain"
            blink_color = (0, 165, 255)

        blink_block = {
            "rate": blink_rate,
            "feedback": blink_msg,
            "color": blink_color,
        }

        return {
            "blink_rate": blink_block,
            "hand_gestures": hand_block,
        }










