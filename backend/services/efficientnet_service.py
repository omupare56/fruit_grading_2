import os
import json
from PIL import Image

EFFICIENTNET_WEIGHTS_PATH = os.environ.get("EFFICIENTNET_MODEL_PATH", "models/efficientnet/efficientnet_v2.pth")

class EfficientNetV2QualityModel:
    def __init__(self, weights_path=EFFICIENTNET_WEIGHTS_PATH):
        self.weights_path = weights_path
        self._model = None
        self.classes = self._load_classes()

    def _load_classes(self):
        try:
            with open("config/classes.json", "r") as f:
                data = json.load(f)
                return data.get("quality_classes", ["Excellent", "Good", "Fair", "Poor"])
        except Exception:
            return ["Excellent", "Good", "Fair", "Poor"]

    def is_configured(self) -> bool:
        """
        Checks whether the trained EfficientNet V2 model weights file exists.
        """
        return os.path.exists(self.weights_path) and os.path.getsize(self.weights_path) > 0

    def get_status(self) -> str:
        return "configured" if self.is_configured() else "not_configured"

    def analyze_crop(self, crop_image: Image.Image):
        """
        Runs inference on an individual fruit crop.
        If weights are not configured, returns None and a transparent error.
        """
        if not self.is_configured():
            return None, "AI model weights are not configured. Upload trained EfficientNet V2 weights to models/efficientnet/efficientnet_v2.pth to perform quality grading."

        try:
            import torch
            import torchvision.transforms as T

            if self._model is None:
                # Load PyTorch model architecture and weights
                self._model = torch.load(self.weights_path, map_location=torch.device('cpu'))
                self._model.eval()

            transform = T.Compose([
                T.Resize((224, 224)),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])

            tensor = transform(crop_image).unsqueeze(0)
            with torch.no_grad():
                outputs = self._model(tensor)
                probs = torch.softmax(outputs, dim=1)[0].tolist()

            best_idx = int(torch.argmax(outputs, dim=1)[0].item())
            predicted_class = self.classes[best_idx] if best_idx < len(self.classes) else "Unknown"
            confidence = round(probs[best_idx], 4)

            prob_map = {self.classes[i]: round(probs[i], 4) for i in range(min(len(self.classes), len(probs)))}

            return {
                "class": predicted_class,
                "confidence": confidence,
                "probabilities": prob_map
            }, None
        except Exception as e:
            return None, f"EfficientNet V2 inference error: {str(e)}"

# Global singleton adapter
efficientnet_service = EfficientNetV2QualityModel()
