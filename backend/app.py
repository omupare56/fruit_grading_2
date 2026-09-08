import os
from flask import Flask, jsonify
from backend.utils.response import api_error
from backend.routes.health import health_bp
from backend.routes.auth import auth_bp
from backend.routes.predictions import predictions_bp
from backend.routes.stats import stats_bp
from backend.routes.upload import upload_bp

def create_app():
    app = Flask(__name__)
    app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20 MB max payload

    # Register all API blueprints under /api
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(predictions_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(upload_bp)

    # CORS support for development
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        return response

    # Global JSON Error Handlers - NEVER return HTML error pages
    @app.errorhandler(400)
    def handle_bad_request(e):
        return api_error(code="BAD_REQUEST", message=str(e.description if hasattr(e, 'description') else e), status_code=400)

    @app.errorhandler(401)
    def handle_unauthorized(e):
        return api_error(code="UNAUTHORIZED", message="Authentication required.", status_code=401)

    @app.errorhandler(403)
    def handle_forbidden(e):
        return api_error(code="FORBIDDEN", message="You do not have permission to access this resource.", status_code=403)

    @app.errorhandler(404)
    def handle_not_found(e):
        return api_error(code="NOT_FOUND", message="The requested API endpoint was not found.", status_code=404)

    @app.errorhandler(413)
    def handle_payload_too_large(e):
        return api_error(code="PAYLOAD_TOO_LARGE", message="Image file exceeds the maximum 15MB limit.", status_code=413)

    @app.errorhandler(422)
    def handle_unprocessable(e):
        return api_error(code="UNPROCESSABLE_ENTITY", message=str(e.description if hasattr(e, 'description') else e), status_code=422)

    @app.errorhandler(500)
    def handle_server_error(e):
        return api_error(code="INTERNAL_SERVER_ERROR", message="An unexpected server error occurred.", status_code=500)

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
