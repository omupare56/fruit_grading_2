import datetime
from flask import Blueprint
from backend.utils.response import api_success
from backend.database.connection import get_db_status
from backend.services.yolo_service import yolo_service
from backend.services.efficientnet_service import efficientnet_service

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def check_health():
    """
    Health check endpoint returning system status and model readiness.
    Every response is JSON.
    """
    db_status = get_db_status()
    yolo_status = yolo_service.get_status()
    eff_status = efficientnet_service.get_status()

    health_data = {
        "api": "healthy",
        "database": db_status,
        "models": {
          "yolo": yolo_status,
          "efficientnet_v2": eff_status
        },
        "optional_modules": {
          "defect_detection": "not_configured",
          "shelf_life_prediction": "not_configured",
          "market_grade": "not_configured"
        },
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

    return api_success(
        data=health_data,
        message="FruitVision DL backend is operational"
    )
