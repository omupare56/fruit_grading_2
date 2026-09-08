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

def token_required(f):
    """
    Decorator to protect routes requiring authentication.
    Passes current_user dict into decorated route.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = None

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1].strip()
        elif "token" in request.cookies:
            token = request.cookies.get("token")

        if not token:
            return api_error(
                code="UNAUTHORIZED",
                message="Authentication token is missing. Please log in to proceed.",
                status_code=401
            )

        payload = decode_token(token)
        if not payload:
            return api_error(
                code="INVALID_TOKEN",
                message="Authentication session is invalid or has expired. Please log in again.",
                status_code=401
            )

        # Look up user in DB if connected
        user_id = payload.get("sub")
        users_col = get_collection("users")
        current_user = None

        if users_col is not None:
            current_user = users_col.find_one({"id": user_id}, {"password_hash": 0, "_id": 0})

        if not current_user:
            # Fallback to payload metadata if database is disconnected
            current_user = {
                "id": user_id,
                "email": payload.get("email"),
                "name": payload.get("name")
            }

        return f(current_user, *args, **kwargs)

    return decorated
