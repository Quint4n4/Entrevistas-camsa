"""
Vistas de la API (delgadas): validan la entrada y delegan en services/selectors.

Endpoints públicos (cliente):
  GET    /api/form/                              -> estructura del formulario
  POST   /api/submissions/                       -> inicia una entrevista (token)
  GET    /api/submissions/<token>/               -> recupera para retomar
  PATCH  /api/submissions/<token>/               -> autoguarda datos/prioridad
  POST   /api/submissions/<token>/answer/        -> guarda una respuesta
  POST   /api/submissions/<token>/complete/      -> marca como completada

Endpoints de admin (requieren login de staff):
  GET    /api/admin/dashboard/                   -> métricas
  GET    /api/admin/submissions/                 -> lista de entrevistas
  GET    /api/admin/submissions/<token>/         -> detalle + lectura estratégica
  PATCH  /api/admin/submissions/<token>/notes/   -> guarda notas estratégicas
"""
from __future__ import annotations

from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Block, Choice, Question, Submission
from .selectors import dashboard_stats, get_active_survey, strategic_reading_for
from .serializers import (
    AdminBlockSerializer,
    AdminChoiceSerializer,
    AdminQuestionSerializer,
    NotesSerializer,
    SubmissionDataSerializer,
    SubmissionDetailSerializer,
    SubmissionListSerializer,
    SurveySerializer,
)


# --------------------------------------------------------------------------- #
#  Público (cliente)                                                           #
# --------------------------------------------------------------------------- #
class FormView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        survey = get_active_survey()
        if survey is None:
            return Response(
                {"detail": "No hay un cuestionario activo."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SurveySerializer(survey).data)


class SubmissionCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        survey = get_active_survey()
        if survey is None:
            return Response(
                {"detail": "No hay un cuestionario activo."},
                status=status.HTTP_404_NOT_FOUND,
            )
        submission = services.start_submission(survey)
        return Response(
            {"token": str(submission.token)}, status=status.HTTP_201_CREATED
        )


class SubmissionDetailView(APIView):
    """Recuperar (para retomar) y autoguardar datos del entrevistado."""

    permission_classes = [AllowAny]

    def get(self, request, token):
        submission = get_object_or_404(Submission, token=token)
        return Response(SubmissionDetailSerializer(submission).data)

    def patch(self, request, token):
        submission = get_object_or_404(Submission, token=token)
        serializer = SubmissionDataSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        services.update_submission_data(submission, serializer.validated_data)
        return Response(SubmissionDetailSerializer(submission).data)


class AnswerView(APIView):
    """Autoguardado de una respuesta."""

    permission_classes = [AllowAny]

    def post(self, request, token):
        submission = get_object_or_404(Submission, token=token)
        question_id = request.data.get("question_id")
        question = get_object_or_404(
            Question, id=question_id, block__survey=submission.survey
        )
        services.save_answer(
            submission=submission,
            question=question,
            value_text=request.data.get("value_text", ""),
            selected_options=request.data.get("selected_options", []),
        )
        return Response({"progress": submission.progress}, status=status.HTTP_200_OK)


class CompleteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        submission = get_object_or_404(Submission, token=token)
        services.complete_submission(submission)
        return Response({"status": submission.status})


# --------------------------------------------------------------------------- #
#  Admin (requiere login de staff)                                            #
# --------------------------------------------------------------------------- #
class AdminLoginView(APIView):
    """Login del panel: devuelve un token si el usuario es staff."""

    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)
        if user is None or not user.is_staff:
            return Response(
                {"detail": "Usuario o contraseña incorrectos, o sin permiso."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        survey = get_active_survey()
        if survey is None:
            return Response(
                {"detail": "No hay un cuestionario activo."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(dashboard_stats(survey))


class AdminSubmissionListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        survey = get_active_survey()
        qs = Submission.objects.filter(survey=survey) if survey else Submission.objects.none()
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(SubmissionListSerializer(qs, many=True).data)


class AdminSubmissionDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, token):
        submission = get_object_or_404(Submission, token=token)
        data = SubmissionDetailSerializer(submission).data
        data["strategic_reading"] = strategic_reading_for(submission)
        return Response(data)


class AdminNotesView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, token):
        submission = get_object_or_404(Submission, token=token)
        serializer = NotesSerializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# --------------------------------------------------------------------------- #
#  Editor del formulario (admin)                                              #
# --------------------------------------------------------------------------- #
class AdminStructureView(APIView):
    """Estructura completa del formulario (incluye preguntas inactivas) para editar."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        survey = get_active_survey()
        if survey is None:
            return Response(
                {"detail": "No hay un cuestionario activo."},
                status=status.HTTP_404_NOT_FOUND,
            )
        blocks = AdminBlockSerializer(
            survey.blocks.all().order_by("order", "id"), many=True
        ).data
        return Response(
            {"id": survey.id, "title": survey.title, "slug": survey.slug, "blocks": blocks}
        )


class AdminBlockViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Block.objects.all()
    serializer_class = AdminBlockSerializer


class AdminQuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Question.objects.all()
    serializer_class = AdminQuestionSerializer


class AdminChoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Choice.objects.all()
    serializer_class = AdminChoiceSerializer
