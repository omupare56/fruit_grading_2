from flask import Blueprint, request
from backend.utils.response import api_success
from backend.auth.jwt_handler import decode_token
from backend.database.connection import get_collection

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Computes real aggregation metrics from MongoDB 'predictions' collection.
    If database is empty, returns clean zero state with 'No analysis data available yet.' message.
    """
    # Optional auth extraction to filter by user or return global/user stats
    auth_header = request.headers.get("Authorization", "")
    user_id = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")

    predictions_col = get_collection("predictions")

    empty_stats = {
        "total_analyses": 0,
        "total_fruits_detected": 0,
        "average_quality_confidence": 0.0,
        "fruit_distribution": {},
        "quality_distribution": {
            "Excellent": 0,
            "Good": 0,
            "Fair": 0,
            "Poor": 0
        },
        "recent_analyses": [],
        "is_empty": True
    }

    if predictions_col is None:
        return api_success(
            data=empty_stats,
            message="No analysis data available yet."
        )

    try:
        query = {"user_id": str(user_id)} if user_id else {}
        records = list(predictions_col.find(query, {"_id": 0}).sort("timestamp", -1))

        if not records:
            return api_success(
                data=empty_stats,
                message="No analysis data available yet."
            )

        total_analyses = len(records)
        total_fruits = 0
        confidence_sum = 0.0
        fruit_dist = {}
        quality_dist = {
            "Excellent": 0,
            "Good": 0,
            "Fair": 0,
            "Poor": 0
        }

        for rec in records:
            detections = rec.get("detections", [])
            total_fruits += len(detections)

            for d in detections:
                fruit_type = d.get("fruit_type", "Other")
                fruit_dist[fruit_type] = fruit_dist.get(fruit_type, 0) + 1

                quality_obj = d.get("quality", {})
                q_class = quality_obj.get("class", "Good")
                q_conf = float(quality_obj.get("confidence", 0.0))

                confidence_sum += q_conf
                if q_class in quality_dist:
                    quality_dist[q_class] += 1
                else:
                    quality_dist[q_class] = quality_dist.get(q_class, 0) + 1

        avg_conf = round(confidence_sum / total_fruits, 4) if total_fruits > 0 else 0.0

        stats_data = {
            "total_analyses": total_analyses,
            "total_fruits_detected": total_fruits,
            "average_quality_confidence": avg_conf,
            "fruit_distribution": fruit_dist,
            "quality_distribution": quality_dist,
            "recent_analyses": records[:5],
            "is_empty": False
        }

        return api_success(
            data=stats_data,
            message="Database statistics retrieved successfully."
        )
    except Exception as e:
        return api_success(
            data=empty_stats,
            message=f"Could not aggregate stats: {str(e)}"
        )
