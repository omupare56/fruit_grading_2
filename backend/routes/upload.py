import io
import base64
from flask import Blueprint, request
from backend.utils.response import api_success, api_error
from backend.utils.image_utils import validate_image_stream

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/api/upload', methods=['POST'])
def upload_image():
    """
    Validates uploaded image and returns metadata and safe preview.
    """
    if 'image' not in request.files:
        return api_error(code="MISSING_FILE", message="No image file provided under key 'image'.", status_code=400)

    file_storage = request.files['image']
    pil_image, err = validate_image_stream(file_storage)
    if err:
        return api_error(code="INVALID_IMAGE", message=err, status_code=400)

    # Generate preview data URL
    buffered = io.BytesIO()
    preview = pil_image.copy()
    preview.thumbnail((800, 800))
    preview.save(buffered, format="JPEG", quality=85)
    data_url = f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

    return api_success(
        data={
            "filename": file_storage.filename,
            "width": pil_image.width,
            "height": pil_image.height,
            "format": pil_image.format or "JPEG",
            "preview_url": data_url
        },
        message="Image validated successfully."
    )
