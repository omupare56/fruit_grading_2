import io
import base64
from PIL import Image

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

def allowed_file(filename: str) -> bool:
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS

def validate_image_stream(file_storage):
    """
    Validates file format, size, and integrity.
    Returns (PIL.Image, error_message).
    """
    if not file_storage or not file_storage.filename:
        return None, "No image file provided."

    if not allowed_file(file_storage.filename):
        return None, "Unsupported file format. Please upload a PNG, JPG, JPEG, or WEBP image."

    file_bytes = file_storage.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return None, f"Image size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # verify integrity
        # Re-open because verify() closes/invalidates the stream
        image = Image.open(io.BytesIO(file_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image, None
    except Exception as e:
        return None, f"Corrupted or unreadable image file: {str(e)}"

def extract_fruit_crop(image: Image.Image, box: dict, target_size=(224, 224)):
    """
    Clamps coordinates and crops the fruit region.
    `box` can contain normalized percentages or pixel coordinates:
    x1, y1, x2, y2 or x, y, width, height.
    Returns (cropped_pil_image, base64_data_url).
    """
    img_w, img_h = image.size

    if "x1" in box and "x2" in box:
        x1 = max(0, min(img_w, int(box["x1"])))
        y1 = max(0, min(img_h, int(box["y1"])))
        x2 = max(x1 + 1, min(img_w, int(box["x2"])))
        y2 = max(y1 + 1, min(img_h, int(box["y2"])))
    elif "x" in box and "width" in box:
        # Percentage coordinates
        x1 = max(0, int((box["x"] / 100.0) * img_w))
        y1 = max(0, int((box["y"] / 100.0) * img_h))
        w = max(1, int((box["width"] / 100.0) * img_w))
        h = max(1, int((box["height"] / 100.0) * img_h))
        x2 = min(img_w, x1 + w)
        y2 = min(img_h, y1 + h)
    else:
        # Default center crop
        x1, y1, x2, y2 = 0, 0, img_w, img_h

    crop = image.crop((x1, y1, x2, y2))
    
    # Generate Base64 Data URL for frontend visualization
    buffered = io.BytesIO()
    # Save a thumbnail sized version
    thumb = crop.copy()
    thumb.thumbnail((320, 320))
    thumb.save(buffered, format="JPEG", quality=85)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{img_str}"

    return crop, data_url
