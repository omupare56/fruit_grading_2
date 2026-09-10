"""
FruitVision DL — Python Flask ML Microservice
==============================================
This is a PURE ML inference service.
It is called internally by the Node.js backend (server.ts) via HTTP proxy.

Endpoints:
  POST /ml/predict   – YOLO + EfficientNet inference (requires X-ML-Secret header)
  GET  /ml/health    – ML model health check
  GET  /api/health   – Overall health (legacy / standalone mode)
  POST /api/predict  – Legacy prediction endpoint (standalone mode)
  POST /api/auth/*   – Auth endpoints (standalone mode only)

Deployment:
  Local:      python -m backend.app   (port 5000)
  Railway:    gunicorn backend.app:app -w 1 -b 0.0.0.0:$PORT
  Render:     gunicorn backend.app:app -w 1 -b 0.0.0.0:$PORT
"""
import os
from flask import Flask, jsonify
from backend.utils.response import api_error
from backend.routes.health import health_bp
from backend.routes.auth import auth_bp
from backend.routes.predictions import predictions_bp
from backend.routes.stats import stats_bp
from backend.routes.upload import upload_bp
from backend.routes.ml import ml_bp


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB

    # ── Register blueprints ───────────────────────────────────────────────────
    app.register_blueprint(ml_bp)           # Internal ML endpoints (/ml/*)
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(predictions_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(upload_bp)

    # ── CORS (allow Node.js backend and frontend origins) ────────────────────
    @app.after_request
    def add_cors(response):
        allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
        response.headers["Access-Control-Allow-Origin"] = allowed_origins
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type,Authorization,X-ML-Secret"
        )
        response.headers["Access-Control-Allow-Methods"] = (
            "GET,POST,PUT,DELETE,OPTIONS"
        )
        return response

    # ── JSON error handlers (never return HTML) ───────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return api_error("BAD_REQUEST", str(getattr(e, "description", e)), 400)

    @app.errorhandler(401)
    def unauthorized(e):
        return api_error("UNAUTHORIZED", "Authentication required.", 401)

    @app.errorhandler(403)
    def forbidden(e):
        return api_error("FORBIDDEN", "Permission denied.", 403)

    @app.errorhandler(404)
    def not_found(e):
        return api_error("NOT_FOUND", "Endpoint not found.", 404)

    @app.errorhandler(413)
    def payload_too_large(e):
        return api_error("PAYLOAD_TOO_LARGE", "Image exceeds 20 MB limit.", 413)

    @app.errorhandler(422)
    def unprocessable(e):
        return api_error("UNPROCESSABLE_ENTITY", str(getattr(e, "description", e)), 422)

    @app.errorhandler(500)
    def server_error(e):
        return api_error("INTERNAL_SERVER_ERROR", "Unexpected server error.", 500)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    print(f"[FruitVision ML Service] Starting on port {port}  debug={debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)
