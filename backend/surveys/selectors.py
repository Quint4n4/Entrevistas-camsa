"""
Capa de lectura (consultas).

Aquí viven las consultas de solo-lectura, como las métricas del dashboard.
"""
from __future__ import annotations

from django.db.models import Count

from .models import Submission, Survey


def get_active_survey() -> Survey | None:
    """Devuelve el cuestionario activo más reciente."""
    return Survey.objects.filter(is_active=True).order_by("-updated_at").first()


# Lectura estratégica automática según la prioridad elegida (viene del PDF).
STRATEGIC_READING: dict[str, str] = {
    Submission.Priority.APPEARANCE: (
        "Ángulo dominante: imagen, vitalidad visible, seguridad personal y verse fuerte."
    ),
    Submission.Priority.LONGEVITY: (
        "Ángulo dominante: prevención, tranquilidad, control del futuro y "
        "vivir más años con calidad."
    ),
    Submission.Priority.MIND: (
        "Ángulo dominante: productividad, enfoque, liderazgo y miedo a perder capacidad."
    ),
}


def strategic_reading_for(submission: Submission) -> str:
    return STRATEGIC_READING.get(submission.priority, "")


def dashboard_stats(survey: Survey) -> dict:
    """Métricas para el panel de administrador."""
    subs = Submission.objects.filter(survey=survey)
    total = subs.count()
    completed = subs.filter(status=Submission.Status.COMPLETED).count()
    in_progress = total - completed  # "a medias"
    completion_rate = round(completed / total * 100, 1) if total else 0.0

    # Siempre mostramos las 3 prioridades (aunque tengan 0), + "Sin definir" si aplica.
    priority_labels = dict(Submission.Priority.choices)
    by_priority = {label: 0 for label in priority_labels.values()}
    sin_definir = 0
    for row in subs.values("priority").annotate(n=Count("id")).order_by():
        label = priority_labels.get(row["priority"])
        if label:
            by_priority[label] = row["n"]
        else:
            sin_definir += row["n"]
    if sin_definir:
        by_priority["Sin definir"] = sin_definir

    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "completion_rate": completion_rate,
        "by_priority": by_priority,
    }
