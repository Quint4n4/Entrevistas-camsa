"""Serializers: traducen los modelos a JSON (y al revés) para la API."""
from rest_framework import serializers

from .models import Answer, Block, Choice, Question, Submission, Survey


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "code",
            "text",
            "help_text",
            "type",
            "is_required",
            "order",
            "choices",
        ]


class BlockSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = ["id", "title", "description", "order", "questions"]

    def get_questions(self, obj: Block) -> list:
        active = obj.questions.filter(is_active=True)
        return QuestionSerializer(active, many=True).data


class SurveySerializer(serializers.ModelSerializer):
    """Estructura completa del formulario que verá el cliente."""

    blocks = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = ["id", "title", "slug", "intro_text", "blocks"]

    def get_blocks(self, obj: Survey) -> list:
        active = obj.blocks.filter(is_active=True)
        return BlockSerializer(active, many=True).data


class SubmissionDataSerializer(serializers.ModelSerializer):
    """Datos del entrevistado + prioridad (lo que se autoguarda)."""

    class Meta:
        model = Submission
        fields = [
            "nombre",
            "email",
            "whatsapp",
            "perfil",
            "empresa",
            "edad",
            "ciudad",
            "consent",
            "priority",
        ]


class AnswerSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Answer
        fields = [
            "question_id",
            "question_text_snapshot",
            "value_text",
            "selected_options",
            "answered_at",
        ]


class SubmissionListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "token",
            "nombre",
            "email",
            "priority",
            "priority_display",
            "status",
            "status_display",
            "progress",
            "started_at",
        ]


class SubmissionDetailSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "token",
            "nombre",
            "email",
            "whatsapp",
            "perfil",
            "empresa",
            "edad",
            "ciudad",
            "consent",
            "priority",
            "priority_display",
            "status",
            "status_display",
            "progress",
            "started_at",
            "last_activity_at",
            "completed_at",
            "notes_copy",
            "notes_objeciones",
            "notes_motivadores",
            "notes_prioridad",
            "notes_insight",
            "notes_offer",
            "notes_final",
            "answers",
        ]


class NotesSerializer(serializers.ModelSerializer):
    """Notas estratégicas (solo admin)."""

    class Meta:
        model = Submission
        fields = [
            "notes_copy",
            "notes_objeciones",
            "notes_motivadores",
            "notes_prioridad",
            "notes_insight",
            "notes_offer",
            "notes_final",
        ]


# --------------------------------------------------------------------------- #
#  Editor del formulario (admin) — lectura y escritura                         #
# --------------------------------------------------------------------------- #
class AdminChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "question", "text", "order"]


class AdminQuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "block",
            "code",
            "text",
            "help_text",
            "type",
            "is_required",
            "is_active",
            "order",
            "choices",
        ]


class AdminBlockSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = ["id", "survey", "title", "description", "order", "is_active", "questions"]

    def get_questions(self, obj: Block) -> list:
        ordered = obj.questions.all().order_by("order", "id")
        return AdminQuestionSerializer(ordered, many=True).data
