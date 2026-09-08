# EfficientNet V2 Quality Model Placement

Place your trained PyTorch EfficientNet V2 model weights here:
- Filename: `efficientnet_v2.pth`
- Expected path: `models/efficientnet/efficientnet_v2.pth`

### Model Requirements:
- Architecture: EfficientNetV2-S / EfficientNetV2-M with a 4-class classification head corresponding to `config/classes.json` (`Excellent`, `Good`, `Fair`, `Poor`).
- Input resolution: 224x224 (individual fruit crop)
- Normalization: ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`

### Note on Missing Weights:
If `efficientnet_v2.pth` is not present, the `efficientnet_service.py` adapter will report `"configured": false` and return a clean configuration error rather than fabricating quality confidence.
