from flask import jsonify

def api_success(data=None, message="Success", status_code=200):
    """
    Standard Success JSON structure:
    {
      "success": true,
      "data": {},
      "message": "..."
    }
    """
    return jsonify({
        "success": True,
        "data": data if data is not None else {},
        "message": message
    }), status_code

def api_error(code="ERROR", message="An unexpected error occurred.", status_code=400):
    """
    Standard Error JSON structure:
    {
      "success": false,
      "error": {
        "code": "...",
        "message": "..."
      }
    }
    """
    return jsonify({
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }), status_code
