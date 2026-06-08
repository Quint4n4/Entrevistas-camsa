"""
Modelos (tablas) del cuestionario.

Idea central:
- El cuestionario (Survey) se divide en Bloques, y cada Bloque tiene Preguntas
  editables desde el panel. Las preguntas de opción tienen Opciones (Choice).
- Cada persona que entra crea una Entrevista (Submission) con sus datos y estado.
- Cada respuesta (Answer) guarda una "foto" (snapshot) del texto de la pregunta,
  para que editar una pregunta más adelante no rompa las respuestas viejas.
"""
import uuid

from django.db import models


class Survey(models.Model):
    """El cuestionario completo."""

    title = models.CharField("Título", max_length=200)
    slug = models.SlugField("Identificador URL", unique=True)
    intro_text = models.TextField("Introducción para el entrevistado", blank=True)
    is_active = models.BooleanField("Activo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cuestionario"
        verbose_name_plural = "Cuestionarios"

    def __str__(self) -> str:
        return self.title


class Block(models.Model):
    """Un bloque o sección del cuestionario (Filtro inicial, Bloque 1, etc.)."""

    survey = models.ForeignKey(Survey, related_name="blocks", on_delete=models.CASCADE)
    title = models.CharField("Título", max_length=200)
    description = models.TextField("Descripción", blank=True)
    order = models.PositiveIntegerField("Orden", default=0)
    is_active = models.BooleanField("Activo", default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Bloque"
        verbose_name_plural = "Bloques"

    def __str__(self) -> str:
        return f"{self.order}. {self.title}"


class Question(models.Model):
    """Una pregunta editable desde el panel."""

    class Type(models.TextChoices):
        TEXT = "text", "Texto corto"
        TEXTAREA = "textarea", "Texto largo"
        SINGLE_CHOICE = "single_choice", "Opción única"
        MULTI_CHOICE = "multi_choice", "Opción múltiple"
        SCALE = "scale", "Escala"

    block = models.ForeignKey(Block, related_name="questions", on_delete=models.CASCADE)
    code = models.SlugField(
        "Código", blank=True, help_text="Identificador estable opcional (p.ej. 'q1')."
    )
    text = models.TextField("Pregunta")
    help_text = models.TextField(
        "Ayuda", blank=True, help_text="Texto gris de ayuda (las pistas 'Profundizar')."
    )
    type = models.CharField(
        "Tipo", max_length=20, choices=Type.choices, default=Type.TEXTAREA
    )
    is_required = models.BooleanField("Obligatoria", default=False)
    order = models.PositiveIntegerField("Orden", default=0)
    is_active = models.BooleanField("Activa", default=True)

    class Meta:
        ordering = ["block__order", "order", "id"]
        verbose_name = "Pregunta"
        verbose_name_plural = "Preguntas"

    def __str__(self) -> str:
        return self.text[:60]


class Choice(models.Model):
    """Una opción de respuesta (para preguntas de opción única/múltiple/escala)."""

    question = models.ForeignKey(Question, related_name="choices", on_delete=models.CASCADE)
    text = models.CharField("Opción", max_length=300)
    order = models.PositiveIntegerField("Orden", default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Opción"
        verbose_name_plural = "Opciones"

    def __str__(self) -> str:
        return self.text


class Submission(models.Model):
    """Una entrevista: los datos y respuestas de una persona."""

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "En progreso"
        COMPLETED = "completed", "Completada"

    class Priority(models.TextChoices):
        APPEARANCE = "appearance", "Verse joven y sano"
        LONGEVITY = "longevity", "Vivir más años"
        MIND = "mind", "Claridad mental y productividad"

    survey = models.ForeignKey(Survey, related_name="submissions", on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # --- Datos del entrevistado ---
    nombre = models.CharField("Nombre", max_length=200, blank=True)
    email = models.EmailField("Email", blank=True)
    whatsapp = models.CharField("WhatsApp", max_length=40, blank=True)
    perfil = models.CharField("Perfil / cargo", max_length=200, blank=True)
    edad = models.CharField("Edad aproximada", max_length=20, blank=True)
    consent = models.BooleanField("Consentimiento", default=False)

    # --- Filtro inicial ---
    priority = models.CharField(
        "Prioridad principal", max_length=20, choices=Priority.choices, blank=True
    )

    # --- Estado / seguimiento ---
    status = models.CharField(
        "Estado", max_length=20, choices=Status.choices, default=Status.IN_PROGRESS
    )
    progress = models.PositiveIntegerField("Avance (%)", default=0)
    started_at = models.DateTimeField("Inicio", auto_now_add=True)
    last_activity_at = models.DateTimeField("Última actividad", auto_now=True)
    completed_at = models.DateTimeField("Completada el", null=True, blank=True)

    # --- Notas estratégicas (SOLO admin, nunca las ve el cliente) ---
    notes_copy = models.TextField("Frases para copy", blank=True)
    notes_insight = models.TextField("Insight central", blank=True)
    notes_offer = models.TextField("Hipótesis de oferta", blank=True)
    notes_final = models.TextField("Notas finales", blank=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "Entrevista"
        verbose_name_plural = "Entrevistas"

    def __str__(self) -> str:
        return f"{self.nombre or 'Sin nombre'} ({self.get_status_display()})"


class Answer(models.Model):
    """Respuesta de una entrevista a una pregunta concreta."""

    submission = models.ForeignKey(Submission, related_name="answers", on_delete=models.CASCADE)
    question = models.ForeignKey(
        Question, related_name="answers", on_delete=models.SET_NULL, null=True
    )
    # "Foto" del texto de la pregunta al momento de responder (no se rompe al editar).
    question_text_snapshot = models.TextField(blank=True)
    value_text = models.TextField("Respuesta (texto)", blank=True)
    selected_options = models.JSONField("Opciones elegidas", default=list, blank=True)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("submission", "question")
        verbose_name = "Respuesta"
        verbose_name_plural = "Respuestas"

    def __str__(self) -> str:
        return f"{self.submission} → {self.question_text_snapshot[:40]}"
