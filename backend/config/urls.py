"""Rutas principales del proyecto."""
from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import include, path, re_path


def spa_index(request):
    """Sirve el index.html del frontend compilado (para el formulario y el panel)."""
    index_path = settings.BASE_DIR / "spa" / "index.html"
    if index_path.exists():
        return FileResponse(open(index_path, "rb"))
    return HttpResponse(
        "Frontend no compilado (estás en modo desarrollo; usa el servidor de Vite).",
        content_type="text/plain",
    )


urlpatterns = [
    # El admin de Django queda en /django-admin/ para no chocar con el panel de React (/admin).
    path("django-admin/", admin.site.urls),
    path("api/", include("surveys.urls")),
    # Cualquier otra ruta sirve el frontend (React maneja /, /admin, etc.).
    re_path(r"^(?!api/|django-admin/|static/).*$", spa_index),
]
