# YOLO Detection Model Placement

Place your trained YOLO detection weights file here:
- Filename: `best.pt`
- Expected path: `models/yolo/best.pt`

### Model Requirements:
- Architecture: YOLOv8 / YOLOv9 / YOLOv10 object detector trained on fruit classes
- Input image size: 640x640 (RGB)
- Outputs: Normalized bounding boxes `[x1, y1, x2, y2]`, class index / fruit type label, and detection confidence score.

### Note on Missing Weights:
If `best.pt` is not present, the `yolo_service.py` adapter will report `"configured": false` and return a clean configuration error rather than inventing fake detections.
