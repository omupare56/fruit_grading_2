import os
import datetime
from functools import wraps
from flask import request
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database.connection import get_collection
from backend.utils.response import api_error

DEFAULT_SECRET = "fruitvision_dl_super_secret_jwt_key_2026_change_in_production"

def get_jwt_secret():
    return os.environ.get("JWT_SECRET", DEFAULT_SECRET)

def hash_password(password: str) -> str:
    """Hashes password using werkzeug pbkdf2:sha256 standard."""
    return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)

def verify_password(password: str, hashed: str) -> bool:
    """Verifies candidate password against stored hash."""
    return check_password_hash(hashed, password)

def generate_token(user_id: str, email: str, name: str) -> str:
    """Creates signed JWT token with 7-day expiration."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")

def decode_token(token: str):
    """Decodes and validates JWT token."""
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def is_review_demo_mode() -> bool:
    val = os.environ.get("REVIEW_DEMO_MODE")
    if val is None:
        val = os.environ.get("DEMO_MODE", "true")
    return str(val).lower() in ("true", "1", "yes")

def get_current_user(allow_demo: bool = False):
    """
    Extracts the authenticated user from request header or cookie.
    If allow_demo is True and review demo mode is active, returns a mock
    review-demo-user when no valid token is present.
    """
    auth_header = request.headers.get("Authorization", "")
    token = None

    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
    elif "token" in request.cookies:
        token = request.cookies.get("token")

    if token in ("undefined", "null", ""):
        token = None

    if not token:
        if allow_demo and is_review_demo_mode():
            return {
                "id": "review-demo-user",
                "email": "demo-reviewer@fruitvision.edu",
                "name": "Review Demo User",
                "institution": "B.Tech Academic Review",
                "role": "Reviewer",
                "is_demo_user": True
            }, None
        return None, ("AUTHENTICATION_REQUIRED", "Please log in to continue.", 401)

    payload = decode_token(token)
    if not payload:
        if allow_demo and is_review_demo_mode():
            return {
                "id": "review-demo-user",
                "email": "demo-reviewer@fruitvision.edu",
                "name": "Review Demo User",
                "institution": "B.Tech Academic Review",
                "role": "Reviewer",
                "is_demo_user": True
            }, None
        return None, ("INVALID_TOKEN", "Authentication session is invalid or has expired. Please log in again.", 401)

    # Look up user in DB if connected
    user_id = payload.get("sub")
    users_col = get_collection("users")
    current_user = None

    if users_col is not None:
        try:
            current_user = users_col.find_one({"id": user_id}, {"password_hash": 0, "_id": 0})
        except Exception:
            pass

    if not current_user:
        # Fallback to payload metadata if database is disconnected
        current_user = {
            "id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
            "role": payload.get("role", "Researcher"),
            "institution": payload.get("institution", "B.Tech Review")
        }

    return current_user, None

def token_required(f):
    """
    Decorator to protect routes requiring real authentication.
    Passes current_user dict into decorated route.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user, err = get_current_user(allow_demo=False)
        if err:
            return api_error(
                code=err[0],
                message=err[1],
                status_code=err[2]
            )
        return f(current_user, *args, **kwargs)

    return decorated

def prediction_token_handler(f):
    """
    Decorator for /api/predict: allows unauthenticated requests in REVIEW_DEMO_MODE=true
    using review-demo-user, but requires valid authentication in production (REVIEW_DEMO_MODE=false).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user, err = get_current_user(allow_demo=True)
        if err:
            return api_error(
                code=err[0],
                message=err[1],
                status_code=err[2]
            )
        return f(current_user, *args, **kwargs)

    return decorated
