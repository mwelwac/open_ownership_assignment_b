from rest_framework.exceptions import ErrorDetail, ValidationError
from rest_framework.views import exception_handler


def _first_error_code(value):
    if isinstance(value, ErrorDetail):
        return value.code
    if isinstance(value, dict):
        for nested in value.values():
            code = _first_error_code(nested)
            if code:
                return code
    if isinstance(value, (list, tuple)):
        for nested in value:
            code = _first_error_code(nested)
            if code:
                return code
    return None


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    original = response.data
    is_validation_error = isinstance(exc, ValidationError)
    if isinstance(original, dict) and "detail" in original:
        detail = str(original["detail"])
    elif is_validation_error:
        detail = "Request validation failed."
    else:
        detail = "The request could not be completed."

    response.data = {
        "code": _first_error_code(original) or getattr(exc, "default_code", "error"),
        "detail": detail,
        "errors": original if is_validation_error else None,
    }
    return response
