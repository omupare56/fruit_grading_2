"""
Internal ML Inference Endpoint — /ml/predict
---------------------------------------------
Called exclusively by the Node.js server.ts backend to run YOLO + EfficientNet
inference. Protected by X-ML-Secret header (server-to-server, not user-facing).

This endpoint is intentionally stateless (no MongoDB):
  – Node.js receives results and persists to MongoDB with the full user record.
  – The Python service focuses purely on ML inference.
"""
import os
from flask import Blueprint, request, jsonify
from backend.utils.image_utils import validate_image_stream
from backend.services.ml_inference import run_ml_inference

ml_bp = Blueprint("ml", __name__)

ML_INTERNAL_SECRET = os.environ.get(
    "ML_INTERNAL_SECRET", "fruitvision-ml-internal-secret"
)


@ml_bp.route("/ml/predict", methods=["POST"])
def ml_predict():
    """
    Internal-only ML prediction endpoint.
    Accepts: multipart/form-data with 'image' + optional form fields.
    Returns: JSON with detections from YOLO + quality grades from EfficientNet.
    """
    # ── Validate internal secret ─────────────────────────────────────────────
    incoming = request.headers.get("X-ML-Secret", "")
    if incoming != ML_INTERNAL_SECRET:
        return jsonify({
            "success": False,
            "error": {"code": "UNAUTHORIZED", "message": "Invalid ML internal secret."}
        }), 401

    # ── Validate image upload ────────────────────────────────────────────────
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": {"code": "MISSING_FILE", "message": "No image file provided."}
        }), 400

    file_storage = request.files["image"]
    user_id = request.form.get("user_id", "anonymous")
    filename = request.form.get("filename", file_storage.filename or "image.jpg")
    is_benchmark = request.form.get("is_benchmark_test") == "true"
    benchmark_data_raw = request.form.get("benchmark_data")
    benchmark_data = None
    if benchmark_data_raw:
        import json
        try:
            benchmark_data = json.loads(benchmark_data_raw)
        except Exception:
            benchmark_data = None

    pil_image, val_err = validate_image_stream(file_storage)
    if val_err:
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_IMAGE", "message": val_err}
        }), 400

    # ── Run ML inference pipeline ────────────────────────────────────────────
    result, err = run_ml_inference(
        image=pil_image,
        user_id=user_id,
        filename=filename,
        is_benchmark_test=is_benchmark,
        benchmark_data=benchmark_data,
    )

    if err:
        return jsonify({
            "success": False,
            "error": {"code": "INFERENCE_ERROR", "message": err}
        }), 422

    return jsonify({"success": True, "data": result}), 200


@ml_bp.route("/ml/health", methods=["GET"])
def ml_health():
    """Health check for the ML microservice (used by Node.js on startup)."""
    from backend.services.yolo_service import yolo_service
    from backend.services.efficientnet_service import efficientnet_service
    return jsonify({
        "success": True,
        "data": {
            "ml_service": "healthy",
            "yolo_status": yolo_service.get_status(),
            "efficientnet_status": efficientnet_service.get_status(),
        }
    }), 200
