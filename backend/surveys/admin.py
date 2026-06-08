"""Registro en el admin de Django (vista interna de respaldo)."""
from django.contrib import admin

from .models import Answer, Block, Choice, Question, Submission, Survey


class BlockInline(admin.TabularInline):
    model = Block
    extra = 0


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ("order", "text", "type", "is_required", "is_active")


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    readonly_fields = ("question_text_snapshot", "value_text", "selected_options")
    can_delete = False


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_active", "updated_at")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [BlockInline]


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ("order", "title", "survey", "is_active")
    list_display_links = ("title",)
    list_editable = ("order", "is_active")
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("order", "text", "block", "type", "is_required", "is_active")
    list_display_links = ("text",)
    list_filter = ("block", "type", "is_active")
    list_editable = ("order", "is_required", "is_active")
    inlines = [ChoiceInline]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "email", "priority", "status", "progress", "started_at")
    list_filter = ("status", "priority")
    search_fields = ("nombre", "email", "whatsapp")
    readonly_fields = ("token", "started_at", "last_activity_at", "completed_at")
    inlines = [AnswerInline]
