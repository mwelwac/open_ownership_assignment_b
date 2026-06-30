from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse, JsonResponse
from django.views.defaults import page_not_found, server_error


def csrf_failure(request, reason=""):
    return JsonResponse(
        {
            "code": "csrf_failed",
            "detail": "CSRF verification failed.",
            "errors": None,
        },
        status=403,
    )


def spa_index(request):
    """Serve the built React entry point for client-side routes."""
    index_path = Path(settings.FRONTEND_INDEX_PATH)
    if not index_path.is_file():
        return HttpResponse(
            "Frontend build not found. Run `npm run build` in the frontend directory.",
            status=503,
            content_type="text/plain",
        )
    return FileResponse(index_path.open("rb"), content_type="text/html")


def api_aware_not_found(request, exception):
    if request.path.startswith("/api/"):
        return JsonResponse(
            {"code": "not_found", "detail": "Not found.", "errors": None},
            status=404,
        )
    return page_not_found(request, exception)


def api_aware_server_error(request):
    if request.path.startswith("/api/"):
        return JsonResponse(
            {
                "code": "server_error",
                "detail": "An unexpected server error occurred.",
                "errors": None,
            },
            status=500,
        )
    return server_error(request)
