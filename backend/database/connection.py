import os
import certifi
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError

_client = None
_db = None

DB_NAME = "fruit_quality_db"

def get_db():
    """
    Returns the MongoDB database instance.
    Reuses connection across serverless / Flask invocations.
    """
    global _client, _db
    if _db is not None:
        return _db

    uri = os.environ.get("MONGODB_URI")
    if not uri:
        # Return None if no URI configured; callers handle fallback gracefully
        return None

    try:
        # TLS CA certifi bundle ensures secure SSL handshake with MongoDB Atlas
        _client = MongoClient(
            uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            maxPoolSize=10
        )
        # Test connection
        _client.admin.command('ping')
        _db = _client[DB_NAME]
        return _db
    except (ConnectionFailure, PyMongoError) as e:
        print(f"[MongoDB Warning] Could not connect to Atlas: {str(e)}")
        return None

def get_db_status():
    """
    Checks real MongoDB Atlas connection health.
    """
    db = get_db()
    if db is None:
        uri = os.environ.get("MONGODB_URI")
        if not uri:
            return "not_configured"
        return "disconnected"
    try:
        db.command('ping')
        return "connected"
    except Exception:
        return "error"

def get_collection(name):
    """
    Helper to access users or predictions collection.
    """
    db = get_db()
    if db is not None:
        return db[name]
    return None
