import os
import json
from PIL import Image

YOLO_WEIGHTS_PATH = os.environ.get("YOLO_MODEL_PATH", "models/yolo/best.pt")

class YOLODetectionAdapter:
    def __init__(self, weights_path=YOLO_WEIGHTS_PATH):
        self.weights_path = weights_path
        self._model = None
        self._load_attempted = False

    def is_configured(self) -> bool:
        """
        Checks whether the trained YOLO model weights file exists.
        """
        return os.path.exists(self.weights_path) and os.path.getsize(self.weights_path) > 0

    def get_status(self) -> str:
        return "configured" if self.is_configured() else "not_configured"

    def detect_fruits(self, image: Image.Image):
        """
        Executes YOLO fruit detection and localization.
        If model weights are not configured, returns None and a transparent error message.
        """
        if not self.is_configured():
            return None, "AI model weights are not configured. Upload trained YOLO weights to models/yolo/best.pt to perform object detection."

        try:
            # Lazy import ultralytics only if weights actually exist
            from ultralytics import YOLO
            if self._model is None:
                self._model = YOLO(self.weights_path)

            results = self._model(image)
            detections = []
            
            for idx, r in enumerate(results):
                boxes = r.boxes
                for b_idx, box in enumerate(boxes):
                    coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    conf = float(box.conf[0].item())
                    cls_id = int(box.cls[0].item())
                    name = r.names.get(cls_id, f"Fruit_{cls_id}")
                    
                    detections.append({
                        "fruit_id": len(detections) + 1,
                        "fruit_type": name,
                        "confidence": round(conf, 4),
                        "bounding_box": {
                            "x1": round(coords[0], 1),
                            "y1": round(coords[1], 1),
                            "x2": round(coords[2], 1),
                            "y2": round(coords[3], 1)
                        }
                    })

            return detections, None
        except Exception as e:
            return None, f"YOLO inference error: {str(e)}"

# Global singleton adapter
yolo_service = YOLODetectionAdapter()
