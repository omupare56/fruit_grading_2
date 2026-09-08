import uuid
import datetime
from flask import Blueprint, request
from backend.utils.response import api_success, api_error
from backend.auth.jwt_handler import hash_password, verify_password, generate_token, token_required
from backend.database.connection import get_collection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    """
    Registers a new student / researcher account with hashed password.
    """
    data = request.get_json(silent=True)
    if not data:
        return api_error(code="INVALID_PAYLOAD", message="Request body must be valid JSON.", status_code=400)

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    institution = data.get("institution", "B.Tech IT Department").strip()

    if not name or len(name) < 2:
        return api_error(code="INVALID_NAME", message="Please provide a valid full name (at least 2 characters).", status_code=422)

    if not email or "@" not in email or "." not in email:
        return api_error(code="INVALID_EMAIL", message="Please provide a valid email address.", status_code=422)

    if not password or len(password) < 6:
        return api_error(code="WEAK_PASSWORD", message="Password must be at least 6 characters long.", status_code=422)

    users_col = get_collection("users")
    user_id = f"user_{uuid.uuid4().hex[:10]}"

    if users_col is not None:
        existing = users_col.find_one({"email": email})
        if existing:
            return api_error(code="USER_EXISTS", message="An account with this email address already exists. Please login.", status_code=409)

        hashed = hash_password(password)
        user_doc = {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": hashed,
            "institution": institution,
            "role": "Researcher",
            "created_at": datetime.datetime.utcnow().isoformat() + "Z"
        }
        users_col.insert_one(user_doc)

    token = generate_token(user_id, email, name)

    return api_success(
        data={
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "institution": institution,
                "role": "Researcher"
            }
        },
        message="Account created successfully.",
        status_code=201
    )

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """
    Authenticates user and returns signed JWT token.
    """
    data = request.get_json(silent=True)
    if not data:
        return api_error(code="INVALID_PAYLOAD", message="Request body must be valid JSON.", status_code=400)

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return api_error(code="MISSING_CREDENTIALS", message="Email and password are required.", status_code=400)

    users_col = get_collection("users")

    if users_col is not None:
        user_doc = users_col.find_one({"email": email})
        if not user_doc or not verify_password(password, user_doc.get("password_hash", "")):
            return api_error(code="INVALID_CREDENTIALS", message="Invalid email or password.", status_code=401)

        user_id = user_doc["id"]
        name = user_doc.get("name", "Researcher")
        token = generate_token(user_id, email, name)

        return api_success(
            data={
                "token": token,
                "user": {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "institution": user_doc.get("institution", "B.Tech IT Department"),
                    "role": user_doc.get("role", "Researcher")
                }
            },
            message="Logged in successfully."
        )
    else:
        # Graceful fallback for local development without active MongoDB URI
        user_id = f"demo_user_{hash(email) % 100000}"
        token = generate_token(user_id, email, "Researcher Demo")
        return api_success(
            data={
                "token": token,
                "user": {
                    "id": user_id,
                    "name": "Researcher Demo",
                    "email": email,
                    "institution": "B.Tech IT Department",
                    "role": "Researcher"
                }
            },
            message="Logged in (development session mode)."
        )

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """
    Stateless logout endpoint.
    Client removes stored JWT token from localStorage / cookies.
    """
    return api_success(
        data={"logged_out": True},
        message="Logged out successfully."
    )

@auth_bp.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Protected endpoint to fetch current authenticated user profile.
    """
    return api_success(
        data={"user": current_user},
        message="User profile retrieved successfully."
    )
