import json
from flask import Blueprint, request
from backend.utils.response import api_success, api_error
from backend.auth.jwt_handler import token_required
from backend.utils.image_utils import validate_image_stream
from backend.services.prediction_service import process_prediction_pipeline
from backend.database.connection import get_collection

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/api/predict', methods=['POST'])
@token_required
def predict(current_user):
    """
    Core prediction endpoint.
    Accepts multipart/form-data with 'image' file.
    Or benchmark evaluation flag with benchmark metadata.
    """
    user_id = current_user.get("id")

    # Check for image file
    if 'image' not in request.files and not request.is_json:
        return api_error(
            code="MISSING_FILE",
            message="No image file was provided in the request payload under key 'image'.",
            status_code=400
        )

    is_benchmark = False
    benchmark_data = None
    filename = "uploaded_fruit.jpg"

    if 'image' in request.files:
        file_storage = request.files['image']
        filename = file_storage.filename or "uploaded_fruit.jpg"
        
        # Check if client passed optional benchmark metadata
        if 'is_benchmark_test' in request.form and request.form['is_benchmark_test'] == 'true':
            is_benchmark = True
            raw_meta = request.form.get('benchmark_data')
            if raw_meta:
                try:
                    benchmark_data = json.loads(raw_meta)
                except Exception:
                    benchmark_data = None

        pil_image, val_err = validate_image_stream(file_storage)
        if val_err:
            return api_error(code="INVALID_IMAGE", message=val_err, status_code=400)
    else:
        return api_error(code="INVALID_REQUEST", message="Please upload a valid image file.", status_code=400)

    # Process through the two-stage AI pipeline
    result, err = process_prediction_pipeline(
        image=pil_image,
        user_id=user_id,
        filename=filename,
        is_benchmark_test=is_benchmark,
        benchmark_data=benchmark_data
    )

    if err:
        return api_error(code="MODEL_WEIGHTS_NOT_CONFIGURED", message=err, status_code=422)

    return api_success(
        data=result,
        message=f"Analyzed {result['fruit_count']} fruits successfully."
    )

@predictions_bp.route('/api/predictions', methods=['GET'])
@token_required
def get_user_predictions(current_user):
    """
    Retrieves all past predictions for the authenticated user from MongoDB.
    """
    user_id = current_user.get("id")
    predictions_col = get_collection("predictions")

    if predictions_col is None:
        return api_success(
            data={"predictions": [], "count": 0},
            message="No database connection. Please configure MONGODB_URI in environment."
        )

    try:
        cursor = predictions_col.find(
            {"user_id": str(user_id)},
            {"_id": 0}
        ).sort("timestamp", -1).limit(50)
        
        predictions_list = list(cursor)

        return api_success(
            data={
                "predictions": predictions_list,
                "count": len(predictions_list)
            },
            message=f"Retrieved {len(predictions_list)} prediction records."
        )
    except Exception as e:
        return api_error(
            code="DATABASE_ERROR",
            message=f"Failed to fetch predictions from MongoDB: {str(e)}",
            status_code=500
        )

@predictions_bp.route('/api/predictions/<prediction_id>', methods=['GET'])
@token_required
def get_single_prediction(current_user, prediction_id):
    """
    Fetches a specific prediction report by ID.
    """
    user_id = current_user.get("id")
    predictions_col = get_collection("predictions")

    if predictions_col is None:
        return api_error(code="DATABASE_UNAVAILABLE", message="Database connection unavailable.", status_code=503)

    try:
        record = predictions_col.find_one(
            {"prediction_id": prediction_id, "user_id": str(user_id)},
            {"_id": 0}
        )
        if not record:
            return api_error(code="NOT_FOUND", message=f"Prediction with ID '{prediction_id}' was not found.", status_code=404)

        return api_success(data=record, message="Prediction retrieved.")
    except Exception as e:
        return api_error(code="DATABASE_ERROR", message=str(e), status_code=500)

@predictions_bp.route('/api/predictions/<prediction_id>', methods=['DELETE'])
@token_required
def delete_prediction(current_user, prediction_id):
    """
    Deletes a prediction record from MongoDB.
    """
    user_id = current_user.get("id")
    predictions_col = get_collection("predictions")

    if predictions_col is None:
        return api_error(code="DATABASE_UNAVAILABLE", message="Database connection unavailable.", status_code=503)

    try:
        result = predictions_col.delete_one({"prediction_id": prediction_id, "user_id": str(user_id)})
        if result.deleted_count == 0:
            return api_error(code="NOT_FOUND", message=f"Prediction '{prediction_id}' not found or already deleted.", status_code=404)

        return api_success(data={"deleted_id": prediction_id}, message="Prediction deleted successfully.")
    except Exception as e:
        return api_error(code="DATABASE_ERROR", message=str(e), status_code=500)
