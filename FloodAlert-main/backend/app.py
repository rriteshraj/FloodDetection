from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import get_coordinates, get_static_map
from model import predict_flood
from PIL import Image
import io
import numpy as np

app = Flask(__name__)

# The frontend is hosted separately in production, so CORS is enabled.
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False
    }
})


@app.route("/")
def home():
    return jsonify({
        "service": "FloodAlert API",
        "status": "running"
    })


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/detect", methods=["POST"])
def detect_flood():
    try:
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Request body must be JSON."
            }), 400

        data = request.get_json(silent=True) or {}
        place = str(data.get("place", "")).strip()

        if not place:
            return jsonify({
                "success": False,
                "error": "Place name is required."
            }), 400

        if len(place) > 120:
            return jsonify({
                "success": False,
                "error": "Place name is too long."
            }), 400

        # 1. Geocode the requested place.
        coords = get_coordinates(place)
        if not coords:
            return jsonify({
                "success": False,
                "error": "Unable to locate the requested place. Please try a more specific location."
            }), 404

        lat, lon = coords

        # 2. Retrieve satellite imagery.
        image_bytes = get_static_map(lat, lon, zoom=9)

        # Do not generate a synthetic fallback image. A fabricated image must
        # never be analysed as if it were satellite imagery.
        if not image_bytes:
            return jsonify({
                "success": False,
                "error": "Satellite imagery could not be retrieved for this location."
            }), 502

        # 3. Decode and validate the image.
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_array = np.asarray(image)
        except Exception:
            return jsonify({
                "success": False,
                "error": "The retrieved satellite image could not be decoded."
            }), 502

        if image_array.size == 0 or min(image_array.shape[:2]) < 64:
            return jsonify({
                "success": False,
                "error": "The retrieved image is unsuitable for analysis."
            }), 422

        # 4. Computer-vision flood-region detection.
        flood_regions = predict_flood(image_array, lat, lon)
        flood_regions = sorted(
            flood_regions,
            key=lambda item: item["distance_km"]
        )

        response_data = {
            "success": True,
            "place": place,
            "latitude": lat,
            "longitude": lon,
            "search_radius_km": 100,
            "analysis_method": "HSV water-region segmentation and contour analysis",
            "flood_regions": flood_regions,
            "total_regions": len(flood_regions),
            "region_summary": {
                "high_risk": sum(
                    r["severity"] == "high" for r in flood_regions
                ),
                "medium_risk": sum(
                    r["severity"] == "medium" for r in flood_regions
                ),
                "low_risk": sum(
                    r["severity"] == "low" for r in flood_regions
                )
            },
            "weather": None,
            "limitations": [
                "Flood detection is based on color-based computer vision.",
                "Satellite imagery quality and cloud/scene conditions can affect results.",
                "Spatial coordinates are approximate and should be validated with authoritative GIS data."
            ]
        }

        return jsonify(response_data)

    except Exception as exc:
        app.logger.exception("Flood detection failed")
        return jsonify({
            "success": False,
            "error": "Flood analysis failed. Please try again later."
        }), 500


if __name__ == "__main__":
    import os
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
