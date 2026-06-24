"""
Carga del cuestionario "Clínica CAMSA · Entrevista Estratégica de Investigación".

Uso:
    python manage.py seed_form          # crea el formulario si no existe
    python manage.py seed_form --reset  # borra y recrea (¡borra entrevistas!)

Las preguntas quedan en la base de datos y luego se editan desde el panel.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from surveys.models import Block, Choice, Question, Survey

SLUG = "entrevista-premium"

INTRO = (
    "Antes de comenzar, muchas gracias por regalarme este tiempo.\n\n"
    "Esta entrevista no es una consulta médica ni busca diagnosticar ninguna condición.\n\n"
    "El objetivo es comprender qué es más importante para ti en esta etapa de tu vida y "
    "cuáles son los desafíos, preocupaciones y objetivos relacionados con tu salud, "
    "desempeño, claridad mental, longevidad y bienestar integral.\n\n"
    "Tus respuestas nos ayudarán a diseñar mejores soluciones para personas con perfiles "
    "similares al tuyo."
)

# Estructura: bloques -> preguntas. Todas de texto largo (con pistas en help_text).
BLOCKS: list[dict] = [
    {
        "title": "Filtro inicial de prioridad",
        "description": "Si solo pudieras mejorar una de las siguientes áreas durante los "
        "próximos 12 meses, ¿cuál elegirías?",
        "questions": [
            {
                "code": "filtro_porque",
                "text": "¿Por qué elegiste esa prioridad?",
                "help_text": "",
                "is_required": True,
            },
            {
                "code": "filtro_recuperar",
                "text": "¿Qué te gustaría recuperar, proteger o mejorar?",
                "help_text": "",
            },
            {
                "code": "filtro_cambio",
                "text": "Si resolvieras completamente esa prioridad, ¿qué cambiaría en tu vida?",
                "help_text": "",
            },
        ],
    },
    {
        "title": "Bloque 1 · Contexto y problema principal",
        "description": "",
        "questions": [
            {
                "code": "q1",
                "text": "Cuéntame un poco de ti.",
                "help_text": "¿A qué te dedicas? ¿Qué nivel de responsabilidad manejas "
                "actualmente? ¿Qué tan dependiente es tu desempeño de tu energía, salud o "
                "capacidad mental?",
                "is_required": True,
            },
            {
                "code": "q2",
                "text": "En los últimos años, ¿has notado algún cambio en tu cuerpo, energía, "
                "salud, apariencia o rendimiento mental?",
                "help_text": "¿Qué fue lo primero que notaste? ¿Cuándo comenzó? "
                "¿Cómo lo describirías?",
            },
            {
                "code": "q3",
                "text": "¿Cuál es el principal reto o problema que enfrentas actualmente "
                "relacionado con tu salud, vitalidad o desempeño?",
                "help_text": "¿Qué es lo más incómodo? ¿Qué es lo que más te preocupa? "
                "¿Qué consecuencias tiene?",
            },
            {
                "code": "q4",
                "text": "Cuéntame una situación reciente donde este problema te haya afectado.",
                "help_text": "¿Qué ocurrió? ¿Dónde estabas? ¿Qué necesitabas resolver? "
                "¿Qué impacto tuvo?",
            },
            {
                "code": "q5",
                "text": "¿Cuál es el costo oculto de este problema que pocas personas conocen?",
                "help_text": "Oportunidades perdidas, menor productividad, relaciones "
                "personales, liderazgo, seguridad personal, calidad de vida.",
            },
        ],
    },
    {
        "title": "Bloque 2 · Detonadores y motivaciones",
        "description": "",
        "questions": [
            {
                "code": "q6",
                "text": "¿Qué te hizo darte cuenta de que era momento de prestarle atención "
                "a este tema?",
                "help_text": "Un estudio médico, un síntoma, un comentario de alguien cercano, "
                "un cambio físico, un cambio en tu rendimiento, una situación específica.",
            },
            {
                "code": "q7",
                "text": "¿Qué te motivaría realmente a buscar una solución seria para este "
                "problema?",
                "help_text": "Verse mejor, sentirse mejor, prevenir enfermedades, tener más "
                "energía, mantener liderazgo, mejorar productividad, vivir más años con calidad.",
            },
            {
                "code": "q8",
                "text": "Si pudieras recuperar, preservar o mejorar una sola cosa, ¿qué sería?",
                "help_text": "Energía, fuerza, apariencia, peso, concentración, memoria, "
                "velocidad mental, salud futura.",
            },
        ],
    },
    {
        "title": "Bloque 3 · Soluciones y experiencias previas",
        "description": "",
        "questions": [
            {
                "code": "q9",
                "text": "¿Qué haces actualmente para tratar de resolver este problema?",
                "help_text": "Ejercicio, nutrición, suplementos, médicos, terapias, "
                "medicamentos, biohacking.",
            },
            {
                "code": "q10",
                "text": "¿Qué soluciones has probado anteriormente?",
                "help_text": "¿Qué funcionó? ¿Qué no funcionó? ¿Qué te decepcionó? "
                "¿Qué volverías a hacer?",
            },
            {
                "code": "q11",
                "text": "¿Qué es lo que menos te ha gustado de las soluciones que has utilizado?",
                "help_text": "Falta de personalización, falta de seguimiento, resultados "
                "limitados, información superficial, mala experiencia médica.",
            },
        ],
    },
    {
        "title": "Bloque 4 · Urgencia e inversión",
        "description": "",
        "questions": [
            {
                "code": "q12",
                "text": "¿Con qué frecuencia piensas o te preocupas por este tema?",
                "help_text": "¿Diario? ¿Semanal? ¿Al viajar? ¿Al trabajar? ¿Al hacer ejercicio? "
                "¿Al realizar estudios médicos?",
            },
            {
                "code": "q13",
                "text": "Actualmente, ¿cuánto tiempo, energía o dinero inviertes en mejorar tu "
                "salud, rendimiento o bienestar?",
                "help_text": "Médicos, estudios, gimnasio, nutrición, suplementos, terapias, "
                "programas de longevidad.",
            },
            {
                "code": "q14",
                "text": "Si existiera una solución médica verdaderamente personalizada para tu "
                "situación, ¿qué tendría que incluir para que la consideraras valiosa?",
                "help_text": "Biomarcadores, estudios avanzados, tecnología, medicina "
                "regenerativa, seguimiento, reportes ejecutivos, acceso directo al médico, "
                "atención concierge.",
            },
        ],
    },
    {
        "title": "Bloque 5 · Decisión y confianza",
        "description": "",
        "questions": [
            {
                "code": "q15",
                "text": "Imagina que en 14 días pudieras tener un mapa completo de tu situación "
                "actual y una estrategia personalizada para optimizar tu salud y rendimiento. "
                "¿Qué valor tendría eso para ti?",
                "help_text": "¿Qué tendría que pasar para que valiera la pena? ¿Qué presupuesto "
                "considerarías razonable? ¿Qué objeciones tendrías? ¿Qué te haría confiar en el "
                "proceso?",
            },
            {
                "code": "q16",
                "text": "¿Qué tendría que demostrar una clínica o especialista para ganar "
                "completamente tu confianza?",
                "help_text": "Evidencia científica, resultados medibles, casos clínicos, "
                "tecnología, experiencia médica, seguimiento, atención personalizada, "
                "confidencialidad.",
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Carga el cuestionario de Clínica CAMSA."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Borra el cuestionario existente y lo recrea (¡borra entrevistas!).",
        )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        existing = Survey.objects.filter(slug=SLUG).first()
        if existing and not options["reset"]:
            self.stdout.write(
                self.style.WARNING(
                    "El cuestionario ya existe. Usa --reset para borrarlo y recrearlo."
                )
            )
            return
        if existing:
            existing.delete()
            self.stdout.write(self.style.WARNING("Cuestionario anterior borrado."))

        survey = Survey.objects.create(
            title="Clínica CAMSA · Entrevista Estratégica de Investigación",
            slug=SLUG,
            intro_text=INTRO,
            is_active=True,
        )

        total_q = 0
        for b_index, block_data in enumerate(BLOCKS, start=1):
            block = Block.objects.create(
                survey=survey,
                title=block_data["title"],
                description=block_data["description"],
                order=b_index,
            )
            for q_index, q in enumerate(block_data["questions"], start=1):
                question = Question.objects.create(
                    block=block,
                    code=q.get("code") or slugify(q["text"])[:50],
                    text=q["text"],
                    help_text=q.get("help_text", ""),
                    type=q.get("type", "textarea"),
                    is_required=q.get("is_required", False),
                    order=q_index,
                )
                for c_index, choice_text in enumerate(q.get("choices", []), start=1):
                    Choice.objects.create(
                        question=question, text=choice_text, order=c_index
                    )
                total_q += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"✓ Cuestionario creado: {survey.title} "
                f"({len(BLOCKS)} bloques, {total_q} preguntas)."
            )
        )
