"""
YOLO Fruit Detection Service
----------------------------
Primary path:  models/yolo/best.pt   (custom-trained weights)
Fallback path: yolov8n.pt            (pretrained COCO; auto-downloaded by ultralytics)

COCO fruit classes available in yolov8n without custom weights:
  46 = banana, 47 = apple, 49 = orange

When best.pt is present (custom-trained on your fruit dataset), ALL custom fruit
classes are detected. When using yolov8n as fallback, detection is limited to the
above COCO classes. Quality grading runs on every detected crop regardless.
"""
import os
import json
from PIL import Image

# ── COCO class indices for fruits in the standard YOLOv8n model ──────────────
COCO_FRUIT_CLASS_IDS = {46, 47, 49, 50, 51, 52}  # banana, apple, orange, broccoli, carrot, hot dog
COCO_FRUIT_NAMES = {
    46: "Banana",
    47: "Apple",
    49: "Orange",
    50: "Broccoli",
    51: "Carrot",
}

YOLO_WEIGHTS_PATH = os.environ.get("YOLO_MODEL_PATH", "models/yolo/best.pt")
YOLO_FALLBACK_MODEL = "yolov8n.pt"   # auto-downloads from ultralytics CDN


class YOLODetectionAdapter:
    def __init__(self, weights_path: str = YOLO_WEIGHTS_PATH):
        self.weights_path = weights_path
        self._model = None
        self._using_fallback = False

    def is_configured(self) -> bool:
        """Returns True if custom weights or ultralytics auto-download is available."""
        # Custom weights take priority
        if os.path.exists(self.weights_path) and os.path.getsize(self.weights_path) > 0:
            return True
        # Ultralytics can auto-download yolov8n.pt on first run
        try:
            import ultralytics  # noqa: F401
            return True
        except ImportError:
            return False

    def get_status(self) -> str:
        if os.path.exists(self.weights_path) and os.path.getsize(self.weights_path) > 0:
            return "configured_custom"
        try:
            import ultralytics  # noqa: F401
            return "configured_pretrained_coco"
        except ImportError:
            return "not_configured"

    def _load_model(self):
        """Lazy-load the YOLO model. Prefers custom best.pt, falls back to yolov8n.pt."""
        if self._model is not None:
            return self._model

        from ultralytics import YOLO

        if os.path.exists(self.weights_path) and os.path.getsize(self.weights_path) > 0:
            print(f"[YOLO] Loading custom weights: {self.weights_path}")
            self._model = YOLO(self.weights_path)
            self._using_fallback = False
        else:
            print(f"[YOLO] Custom weights not found at '{self.weights_path}'. "
                  "Auto-downloading yolov8n.pt (COCO pretrained) from ultralytics CDN...")
            self._model = YOLO(YOLO_FALLBACK_MODEL)
            self._using_fallback = True

        return self._model

    def detect_fruits(self, image: Image.Image):
        """
        Runs YOLO inference on the provided PIL image.
        Returns (list[detection_dict], error_str | None).
        """
        if not self.is_configured():
            return None, (
                "ultralytics package is not installed. "
                "Run: pip install ultralytics"
            )

        try:
            model = self._load_model()
            results = model(image)
            detections = []

            for r in results:
                boxes = r.boxes
                for box in boxes:
                    coords = box.xyxy[0].tolist()   # [x1, y1, x2, y2] pixels
                    conf = float(box.conf[0].item())
                    cls_id = int(box.cls[0].item())
                    raw_name = r.names.get(cls_id, f"Object_{cls_id}")

                    # When using COCO fallback, only include known fruit classes
                    if self._using_fallback and cls_id not in COCO_FRUIT_CLASS_IDS:
                        continue

                    # Map COCO class names to friendly fruit names
                    friendly_name = (
                        COCO_FRUIT_NAMES.get(cls_id, raw_name.capitalize())
                        if self._using_fallback else raw_name
                    )

                    detections.append({
                        "fruit_id": len(detections) + 1,
                        "fruit_type": friendly_name,
                        "confidence": round(conf, 4),
                        "bounding_box": {
                            "x1": round(coords[0], 1),
                            "y1": round(coords[1], 1),
                            "x2": round(coords[2], 1),
                            "y2": round(coords[3], 1),
                        },
                        "using_pretrained_fallback": self._using_fallback,
                    })

            return detections, None

        except Exception as e:
            return None, f"YOLO inference error: {str(e)}"


# Global singleton
yolo_service = YOLODetectionAdapter()
