import numpy as np
import cv2


def predict_flood(image_array, center_lat, center_lon):
    """
    Detect water-like regions in satellite imagery using HSV thresholding,
    morphological cleanup, and contour analysis.

    This is a classical computer-vision segmentation pipeline; it is not
    a trained U-Net/CNN model.
    """
    try:
        if image_array is None or image_array.size == 0:
            return []

        if len(image_array.shape) == 2:
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_GRAY2BGR)
        elif image_array.shape[2] == 4:
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGBA2BGR)
        else:
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)

        height, width = image_bgr.shape[:2]
        if height < 64 or width < 64:
            return []

        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

        # Blue/cyan water-like regions.
        lower_water = np.array([90, 50, 0], dtype=np.uint8)
        upper_water = np.array([130, 255, 200], dtype=np.uint8)
        water_mask = cv2.inRange(hsv, lower_water, upper_water)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (5, 5)
        )
        water_mask = cv2.morphologyEx(
            water_mask, cv2.MORPH_CLOSE, kernel, iterations=2
        )
        water_mask = cv2.morphologyEx(
            water_mask, cv2.MORPH_OPEN, kernel, iterations=1
        )

        contours, _ = cv2.findContours(
            water_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        regions = []

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 500:
                continue

            moments = cv2.moments(contour)
            if moments["m00"] == 0:
                continue

            cx = int(moments["m10"] / moments["m00"])
            cy = int(moments["m01"] / moments["m00"])

            x, y, box_w, box_h = cv2.boundingRect(contour)

            hull = cv2.convexHull(contour)
            hull_area = cv2.contourArea(hull)
            solidity = area / hull_area if hull_area > 0 else 0.0

            pixel_distance = np.hypot(
                cx - width / 2,
                cy - height / 2
            )
            max_distance = np.hypot(width / 2, height / 2)
            normalized_distance = (
                pixel_distance / max_distance * 100
                if max_distance else 0
            )

            if area > 10000 and solidity > 0.7:
                severity = "high"
                confidence = min(0.95, 0.70 + solidity * 0.25)
            elif area > 5000 and solidity > 0.5:
                severity = "medium"
                confidence = min(0.90, 0.60 + solidity * 0.20)
            else:
                severity = "low"
                confidence = min(0.85, 0.50 + solidity * 0.15)

            color = {
                "high": "red",
                "medium": "yellow",
                "low": "green"
            }[severity]

            # Approximate spatial conversion for display only.
            lat_offset = ((cy - height / 2) / height)
            lon_offset = ((cx - width / 2) / width)

            regions.append({
                "center_lat": float(center_lat + lat_offset),
                "center_lon": float(center_lon + lon_offset),
                "pixel_coords": {
                    "min_x": int(x),
                    "max_x": int(x + box_w),
                    "min_y": int(y),
                    "max_y": int(y + box_h),
                    "centroid_x": cx,
                    "centroid_y": cy
                },
                "area": int(area),
                "confidence": round(float(confidence), 4),
                "distance_km": round(float(normalized_distance), 2),
                "severity": severity,
                "color": color,
                "solidity": round(float(solidity), 4)
            })

        regions.sort(key=lambda item: item["confidence"], reverse=True)
        return regions[:10]

    except Exception:
        return []
