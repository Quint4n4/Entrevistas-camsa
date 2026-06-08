"""
Capa de lógica de negocio (escritura).

Las vistas son "delgadas": reciben la petición y delegan aquí el trabajo real.
"""
from __future__ import annotations

from django.utils import timezone

from .models import Answer, Question, Submission, Survey


def start_submission(survey: Survey) -> Submission:
    """Crea una entrevista nueva (en progreso) y devuelve su token."""
    return Submission.objects.create(survey=survey)


def update_submission_data(submission: Submission, data: dict) -> Submission:
    """Autoguardado de los datos del entrevistado y la prioridad."""
    for field in ("nombre", "email", "whatsapp", "perfil", "edad", "consent", "priority"):
        if field in data:
            setattr(submission, field, data[field])
    submission.save()
    return submission


def save_answer(
    submission: Submission,
    question: Question,
    value_text: str = "",
    selected_options: list | None = None,
) -> Answer:
    """Guarda (o actualiza) la respuesta a una pregunta y recalcula el avance."""
    answer, _ = Answer.objects.update_or_create(
        submission=submission,
        question=question,
        defaults={
            "question_text_snapshot": question.text,
            "value_text": value_text or "",
            "selected_options": selected_options or [],
        },
    )
    recalculate_progress(submission)
    return answer


def recalculate_progress(submission: Submission) -> None:
    """Calcula el % de avance según preguntas activas respondidas."""
    total = Question.objects.filter(
        block__survey=submission.survey, is_active=True
    ).count()
    answered = submission.answers.count()
    submission.progress = int(answered / total * 100) if total else 0
    submission.save(update_fields=["progress", "last_activity_at"])


def complete_submission(submission: Submission) -> Submission:
    """Marca la entrevista como completada."""
    submission.status = Submission.Status.COMPLETED
    submission.completed_at = timezone.now()
    submission.progress = 100
    submission.save(
        update_fields=["status", "completed_at", "progress", "last_activity_at"]
    )
    return submission
