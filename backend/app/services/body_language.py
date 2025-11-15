import cv2
import mediapipe as mp
import numpy as np
from collections import deque
#import streamlit as st
import time

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_holistic = mp.solutions.holistic

# ---------- Tuning constants --------------------------------------------------------------------
# Hand velocity
HAND_EMA_ALPHA = 0.3  # Smooth hand movement readings to avoid jitter
V_DEAD = 0.05  # Minimum velocity to be considered movement
V_GOOD_LO = 0.1  # Lower bound of "good" movement speed
V_GOOD_HI = 0.8  # Upper bound of "good" movement speed
THRESH_RED = 1.2  # Threshold for "too fast" movement
SCORE_WIN_S = 10.0  # Time window in seconds for hand movement score

# Expression measures
FROWN_CALIB_FRAMES = 30  # Amount of frames used to build neutral baseline
FROWN_DELTA_PERCENTAGE = 0.004  # Change in height required to be considered frown


# ------------ Analyzer (Detection) ----------------------------------------------------------------------------
class BodyLanguageAnalyzer:
    def __init__(self):
        # Blink constants
        self.blink_total = 0
        self.eye_closed_frames = 0
        self.total_frames = 0
        self.start_time = time.time()

        # Frown constants
        self.baseline_frames = 0  # Frames collected for baseline, up to 30
        self.base_left = None  # Left mouth corner baseline
        self.base_right = None  # Right mouth corner baseline
        self.base_left_samples = []
        self.base_right_samples = []

        self.is_frowning_now = False
        self.frown_frame_count = 0

        # Hand movement constants
        self.hand_state = {
            "left": {"prev": None, "v_ema": 0.0, "t_prev": None},
            "right": {"prev": None, "v_ema": 0.0, "t_prev": None},
        }
        self.hand_band_samples = deque(maxlen=300)
        self.hand_vel_window = deque(maxlen=300)
        self.last_hand_score = 0.0
        self.last_hand_v = 0.0

    # Blink EAR
    def calculate_ear(self, eye_landmarks):
        v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        return (v1 + v2) / (2.0 * h)

    # Frown detector
    def detect_expression(self, face_landmarks, img_w, img_h):
        # Frown if corners drop below baseline by > FROWN_DELTA_PERCENTAGE * img_h, otherwise smile
        L = face_landmarks[61]  # Left mouth corner
        R = face_landmarks[291]  # Right mouth corner
        NOSE = face_landmarks[1]  # Nose tip (vertical ref)

        left_y = L.y * img_h
        right_y = R.y * img_h
        nose_y = NOSE.y * img_h

        # Relative vertical distances vs nose (positive = lower / more down)
        rel_left = left_y - nose_y
        rel_right = right_y - nose_y

        # Build baselines during calibration
        if self.baseline_frames < FROWN_CALIB_FRAMES:
            self.base_left_samples.append(rel_left)
            self.base_right_samples.append(rel_right)
            self.baseline_frames += 1
            if self.baseline_frames == FROWN_CALIB_FRAMES:
                self.base_left = float(np.mean(self.base_left_samples))
                self.base_right = float(np.mean(self.base_right_samples))
            self.is_frowning_now = False
            return

        if self.base_left is None or self.base_right is None:  # Calibration not done
            self.is_frowning_now = False
            return

        # Movement in corner vs baseline
        dL = rel_left - self.base_left
        dR = rel_right - self.base_right

        frown_threshold = FROWN_DELTA_PERCENTAGE * img_h

        # Corner events
        left_down = dL > frown_threshold
        right_down = dR > frown_threshold

        # If both corners down past threshold, it's a frown
        frown = left_down and right_down
        self.is_frowning_now = bool(frown)

    def _now(self):
        return time.time()

    def _create_scale(self, results, img_w, img_h):
        # Establish reference for hand movement
        # Try shoulders first, then face width, else default to image width
        if results and results.pose_landmarks:
            lm = results.pose_landmarks.landmark
            L = lm[mp_holistic.PoseLandmark.LEFT_SHOULDER.value]
            R = lm[mp_holistic.PoseLandmark.RIGHT_SHOULDER.value]
            pL = np.array([L.x * img_w, L.y * img_h])
            pR = np.array([R.x * img_w, R.y * img_h])
            d = float(np.linalg.norm(pR - pL))  # Shoulder width
            if d > 1.0:
                return d
        if results and results.face_landmarks:
            lm = results.face_landmarks.landmark
            L, R = lm[33], lm[263]  # Left and right face edges
            d = float(
                np.linalg.norm(
                    np.array([L.x * img_w, L.y * img_h])
                    - np.array([R.x * img_w, R.y * img_h])
                )
            )  # Face width
            if d > 1.0:
                return d
        return float(img_w)

    def _update_window_hist(self, window, horizon_s):
        # Remove old entries past horizon_s time
        now = self._now()
        while window and (now - window[0][0] > horizon_s):
            window.popleft()

    def _update_hand_velocity(self, which, curr_xy, scale_px, t_now):
        # Calculate how fast hands are moving
        state = self.hand_state[which]
        prev_xy, t_prev = state["prev"], state["t_prev"]
        state["prev"], state["t_prev"] = curr_xy, t_now
        if prev_xy is None or t_prev is None:
            return None
        time_elapsed = max(t_now - t_prev, 1e-6)
        v = float(np.linalg.norm(curr_xy - prev_xy) / time_elapsed)  # change in position over time
        v_norm = v / max(scale_px, 1.0)  # normalize velocity with scale created above
        if v_norm < V_DEAD:
            v_norm = 0.0
        state["v_ema"] = (1 - HAND_EMA_ALPHA) * state["v_ema"] + HAND_EMA_ALPHA * v_norm
        return state["v_ema"]

    def _update_hands_velocity_and_score(self, results, img_w, img_h):
        scale = self._create_scale(results, img_w, img_h)
        t_now = self._now()

        velocity_vals = []
        for LorR, hand_lms in (
            ("left", results.left_hand_landmarks),
            ("right", results.right_hand_landmarks),
        ):
            if hand_lms:
                wrist = hand_lms.landmark[0]
                xy = np.array([wrist.x * img_w, wrist.y * img_h], dtype=float)
                v_norm = self._update_hand_velocity(LorR, xy, scale, t_now)
                if v_norm is not None:
                    velocity_vals.append(v_norm)

        v_mean = np.mean(velocity_vals) if velocity_vals else 0.0
        within_ideal_speed = int(V_GOOD_LO <= v_mean <= V_GOOD_HI)

        # Calculate hand movement score
        self.hand_band_samples.append((t_now, within_ideal_speed))
        self.hand_vel_window.append((t_now, v_mean))
        self._update_window_hist(self.hand_band_samples, SCORE_WIN_S)
        self._update_window_hist(self.hand_vel_window, SCORE_WIN_S)

        good_frac = (
            np.mean([b for _, b in self.hand_band_samples])
            if self.hand_band_samples
            else 0.0
        )
        self.last_hand_score = float(good_frac * 100.0)
        self.last_hand_v = float(v_mean)

    # Updates to be made per frame
    def update(self, results, img_h, img_w):
        self.total_frames += 1

        if results.face_landmarks:
            face_landmarks = results.face_landmarks.landmark

            # See if blinking
            left_eye_idx = [33, 160, 158, 133, 153, 144]
            right_eye_idx = [362, 385, 387, 263, 373, 380]
            left_eye = np.array(
                [
                    [face_landmarks[i].x * img_w, face_landmarks[i].y * img_h]
                    for i in left_eye_idx
                ]
            )
            right_eye = np.array(
                [
                    [face_landmarks[i].x * img_w, face_landmarks[i].y * img_h]
                    for i in right_eye_idx
                ]
            )
            avg_ear = (self.calculate_ear(left_eye) + self.calculate_ear(right_eye)) / 2
            if avg_ear < 0.2:
                self.eye_closed_frames += 1
            else:
                if self.eye_closed_frames >= 2:
                    self.blink_total += 1  # If blinking, update count
                self.eye_closed_frames = 0

            # See if frowning
            self.detect_expression(face_landmarks, img_w, img_h)

            # Update frowning frame count
            if self.baseline_frames >= FROWN_CALIB_FRAMES:
                if self.is_frowning_now:
                    self.frown_frame_count += 1

        # Hands
        self._update_hands_velocity_and_score(results, img_w, img_h)

    # --------------------------------- Video : analyzing and displaying ----------------------------------------
    def get_feedback(self):
        if self.total_frames == 0:
            return {}

        elapsed_min = (time.time() - self.start_time) / 60

        # Blink rate
        blink_rate = self.blink_total / elapsed_min if elapsed_min > 0 else 0

        # Hand movement velocity
        over_movement_velocity = self.last_hand_v >= THRESH_RED
        hand_color = (0, 0, 255) if over_movement_velocity else (0, 255, 0)
        hand_feedback = (
            "Slow down hand gestures!" if over_movement_velocity else "Good gestures!"
        )

        # Frown percentage
        frames_after_cal = max(1, self.total_frames - FROWN_CALIB_FRAMES)
        frown_time_PERCENTAGE = (self.frown_frame_count / frames_after_cal) * 100
        if self.baseline_frames < FROWN_CALIB_FRAMES:
            expr_feedback = f"Setting up... {self.baseline_frames}/{FROWN_CALIB_FRAMES}"
            expr_color = (0, 165, 255)
        else:
            if self.is_frowning_now:
                expr_feedback = "Frowning detected!"
                expr_color = (0, 0, 255)  # red
            else:
                expr_feedback = "Doing great!"
                expr_color = (0, 255, 0)  # green

        return {
            "expression": {
                "feedback": expr_feedback,
                "color": expr_color,
            },
            "total_frown_time": {
                "score": frown_time_PERCENTAGE,
                "feedback": (
                    "Minimal frowning overall, good job!"
                    if frown_time_PERCENTAGE < 20
                    else "Try to maintain positive expression."
                ),
                "color": (0, 255, 0) if frown_time_PERCENTAGE < 25 else (0, 0, 255),
            },
            "hand_gestures": {
                "score": self.last_hand_score,
                "feedback": hand_feedback,
                "color": hand_color,
            },
            "blink_rate": {
                "rate": blink_rate,
                "feedback": (
                    "Naturally blinking"
                    if 5 <= blink_rate <= 30
                    else "Trying blinking slower"
                    if blink_rate > 30
                    else "Measuring..."
                    if elapsed_min < 0.2
                    else "Remember to blink!"
                ),
                "color": (0, 255, 0) if 15 <= blink_rate <= 30 else (0, 165, 255),
            },
        }

    def get_frown_percentage(self):
        if self.total_frames <= FROWN_CALIB_FRAMES:
            return 0.0
        frames_after_cal = self.total_frames - FROWN_CALIB_FRAMES
        return (self.frown_frame_count / frames_after_cal) * 100





def main():
    cap = cv2.VideoCapture(1)  # Might be 0 on some machines
    metrics = BodyLanguageAnalyzer()

    with mp_holistic.Holistic(
        min_detection_confidence=0.5,  # How sure detector needs to be to detect features
        min_tracking_confidence=0.5,  # How sure detector needs to be to keep tracking
        refine_face_landmarks=True,
    ) as holistic:
        while cap.isOpened():  # Process video frames
            success, image = cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            # Convert to RGB and process with MediaPipe Holistic
            image.flags.writeable = False
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = holistic.process(image_rgb)

            # Convert back to BGR for display
            image.flags.writeable = True
            image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

            # Update metrics
            img_h, img_w = image.shape[:2]
            metrics.update(results, img_h, img_w)

            # Get and display analysis
            feedback = metrics.get_feedback()
            #draw_metrics(image, feedback)

            # Show the camera feed
            cv2.imshow("Interview Body Language Analyzer", image)
            key = cv2.waitKey(5) & 0xFF
            if key == 27:  # ESC
                break
            elif key == ord("r"):
                metrics = BodyLanguageAnalyzer()
                print("Metrics reset! Recalibrating...")

    cap.release()
    cv2.destroyAllWindows()

    # Final feedback
    print("\n" + "=" * 50)
    print("Analysis Complete! Here is your feedback:")
    print("=" * 50)
    final_feedback = metrics.get_feedback()

    # Store feedback in session state for Gemini
    visual_analysis = {
        "blink_rate": {
            "rate": final_feedback["blink_rate"]["rate"],
            "feedback": final_feedback["blink_rate"]["feedback"],
        },
        "expression": {
            "feedback": final_feedback["expression"]["feedback"],
            "frown_percentage": metrics.get_frown_percentage(),
        },
        "hand_gestures": {
            "score": final_feedback["hand_gestures"]["score"],
            "feedback": final_feedback["hand_gestures"]["feedback"],
        },
    }
    #st.session_state["visual_analysis"] = visual_analysis

    # Print feedback
    for metric, data in final_feedback.items():
        print(f"\n{metric.replace('_', ' ').title()}:")
        if metric == "blink_rate":
            print(f"  Rate: {data['rate']:.1f} blinks/minute")
        elif metric == "expression":
            print(f"  Final Status: {data['feedback']}")
        elif "score" in data:
            print(f"  Score: {data['score']:.1f}%")
        print(f"  Feedback: {data['feedback']}")

    print("\nExport:")
    print(f"  Frown %: {metrics.get_frown_percentage():.2f}%")
    print("=" * 50)


if __name__ == "__main__":
    main()

