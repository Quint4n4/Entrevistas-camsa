"""Rutas de la app surveys."""
from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("admin/blocks", views.AdminBlockViewSet, basename="adminblock")
router.register("admin/questions", views.AdminQuestionViewSet, basename="adminquestion")
router.register("admin/choices", views.AdminChoiceViewSet, basename="adminchoice")

urlpatterns = [
    # --- Público (cliente) ---
    path("form/", views.FormView.as_view()),
    path("submissions/", views.SubmissionCreateView.as_view()),
    path("submissions/<uuid:token>/", views.SubmissionDetailView.as_view()),
    path("submissions/<uuid:token>/answer/", views.AnswerView.as_view()),
    path("submissions/<uuid:token>/complete/", views.CompleteView.as_view()),
    # --- Admin ---
    path("admin/login/", views.AdminLoginView.as_view()),
    path("admin/dashboard/", views.DashboardView.as_view()),
    path("admin/submissions/", views.AdminSubmissionListView.as_view()),
    path("admin/submissions/<uuid:token>/", views.AdminSubmissionDetailView.as_view()),
    path("admin/submissions/<uuid:token>/notes/", views.AdminNotesView.as_view()),
    # --- Editor del formulario ---
    path("admin/structure/", views.AdminStructureView.as_view()),
]

urlpatterns += router.urls
