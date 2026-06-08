"""
Carga inicial del cuestionario "Entrevista Premium · Anti-aging, Longevidad y Mente".

Uso:
    python manage.py seed_form          # crea el formulario si no existe
    python manage.py seed_form --reset  # borra y recrea (¡borra entrevistas!)

Recuerda: estas preguntas quedan en la base de datos y luego se pueden editar
desde el panel. Esto es solo la "versión 1" de arranque.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from surveys.models import Block, Choice, Question, Survey

SLUG = "entrevista-premium"

INTRO = (
    "Antes de comenzar, muchas gracias por regalarme este tiempo. Esta entrevista no es "
    "una consulta médica ni busca diagnosticar nada. El objetivo es entender qué es más "
    "importante para ti en esta etapa: verte y sentirte joven, vivir más años con calidad, "
    "o mantener tu claridad mental y productividad.\n\n"
    "Después de esa primera priorización, te haré algunas preguntas abiertas para entender "
    "tu experiencia, tus retos actuales, qué has probado, qué no te ha funcionado y qué "
    "tendría que tener una solución ideal."
)

# Estructura: bloques -> preguntas -> (opciones).
# type: "textarea" | "single_choice" | "multi_choice" | "scale"
BLOCKS: list[dict] = [
    {
        "title": "Filtro inicial",
        "description": "Antes de iniciar, prioricemos lo más importante para ti en este momento.",
        "questions": [
            {
                "code": "filtro_porque",
                "text": "¿Por qué elegiste esa prioridad como la más importante para ti?",
                "help_text": "Pistas: ¿Qué está pasando hoy que hace que eso sea más importante? "
                "¿Qué te preocupa si no lo atiendes? ¿Qué te gustaría recuperar, proteger o mejorar?",
                "type": "textarea",
                "is_required": True,
            },
            {
                "code": "filtro_cambio",
                "text": "Si resolvieras esa prioridad, ¿qué cambiaría de forma concreta en tu "
                "vida, trabajo o seguridad personal?",
                "help_text": "Pistas: ¿Qué resultado haría que dijeras “esto valió completamente "
                "la pena”? ¿Cómo se vería tu vida si esto mejora? ¿Qué impacto tendría en tu "
                "familia, empresa, liderazgo o confianza?",
                "type": "textarea",
                "is_required": False,
            },
        ],
    },
    {
        "title": "Bloque 1 · Contexto, dolores y problema principal",
        "description": "",
        "questions": [
            {
                "code": "q1",
                "text": "Para empezar, cuéntame un poco de ti: ¿a qué te dedicas y qué tipo de "
                "decisiones, responsabilidades o presiones manejas actualmente?",
                "help_text": "Pistas: ¿Qué tan dependiente es tu trabajo de tu energía, claridad "
                "mental, presencia física o vitalidad? ¿Qué pasa si tú no estás al 100%?",
                "type": "textarea",
                "is_required": True,
            },
            {
                "code": "q2",
                "text": "En los últimos meses o años, ¿has sentido algún cambio en tu cuerpo, "
                "energía, apariencia, salud, enfoque o rendimiento?",
                "help_text": "Pistas: ¿Qué fue lo primero que notaste? ¿Fue algo gradual o "
                "repentino? ¿Cómo describirías ese cambio con tus propias palabras?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q3",
                "text": "¿Cuál es el reto más incómodo que enfrentas hoy relacionado con verte "
                "sano, vivir más años o mantener tu claridad mental?",
                "help_text": "Pistas: ¿Cuándo aparece más ese reto? ¿En qué momentos se vuelve "
                "más evidente? ¿Qué es lo que más te preocupa de esto?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q4",
                "text": "Cuéntame de la última vez que sentiste que este problema te afectó. "
                "¿Qué pasó exactamente?",
                "help_text": "Pistas: ¿Dónde estabas? ¿Qué estabas haciendo? ¿Qué necesitabas "
                "resolver? ¿Cómo reaccionaste? ¿Qué consecuencia tuvo?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q5",
                "text": "¿Cómo afecta esto tu vida diaria, tu trabajo, tu forma de liderar o tu "
                "seguridad personal?",
                "help_text": "Pistas: ¿Te hace sentir menos energía, menos presencia o menos "
                "control? ¿Te afecta en reuniones, decisiones, relaciones, viajes o momentos de "
                "presión? ¿Sientes que tienes que esforzarte más para rendir igual?",
                "type": "textarea",
                "is_required": False,
            },
        ],
    },
    {
        "title": "Bloque 2 · Emoción, identidad y motivaciones",
        "description": "",
        "questions": [
            {
                "code": "q6",
                "text": "¿Cómo te hace sentir darte cuenta de que tu cuerpo, energía, apariencia "
                "o mente no responden igual que antes?",
                "help_text": "Pistas: ¿Te genera frustración, preocupación, enojo, miedo, "
                "resignación o urgencia? ¿Lo hablas con alguien o lo manejas en privado? "
                "¿Qué parte te cuesta más aceptar?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q7",
                "text": "¿Qué te motivaría realmente a buscar una solución seria para este tema?",
                "help_text": "Puedes elegir varias.",
                "type": "multi_choice",
                "is_required": False,
                "choices": [
                    "Verte mejor",
                    "Prevenir problemas futuros",
                    "Vivir más años con calidad",
                    "Recuperar enfoque y productividad",
                    "Seguir liderando con fuerza",
                    "Evitar perder capacidad, presencia o vitalidad",
                ],
            },
            {
                "code": "q8",
                "text": "Si pudieras recuperar, preservar o mejorar algo específico, ¿qué sería "
                "lo más valioso para ti?",
                "help_text": "Elige la opción que más te represente.",
                "type": "single_choice",
                "is_required": False,
                "choices": [
                    "Apariencia joven, vitalidad física, peso, fuerza o energía",
                    "Años de vida saludable, prevención, biomarcadores o tranquilidad",
                    "Claridad mental, memoria, enfoque profundo, productividad o velocidad para decidir",
                ],
            },
        ],
    },
    {
        "title": "Bloque 3 · Soluciones actuales y comportamiento de compra",
        "description": "",
        "questions": [
            {
                "code": "q9",
                "text": "¿Qué haces actualmente para resolver o compensar este problema?",
                "help_text": "Pistas: ¿Duermes más, haces ejercicio, tomas suplementos o cambiaste "
                "tu alimentación? ¿Vas con médicos, nutriólogos, entrenadores, terapeutas o "
                "especialistas? ¿Has usado vitaminas, hormonas, chequeos, biohacking, apps, "
                "retiros o tratamientos estéticos?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q10",
                "text": "¿Qué soluciones, especialistas, tratamientos o productos has probado "
                "hasta ahora?",
                "help_text": "Pistas: ¿Qué te funcionó aunque fuera parcialmente? ¿Qué no te "
                "funcionó? ¿Qué te pareció genérico, superficial o poco personalizado? ¿Qué te "
                "hizo perder confianza?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q11",
                "text": "¿Qué no te ha gustado de las soluciones actuales que has usado?",
                "help_text": "Pistas: ¿Sentiste que trataban síntomas sueltos? ¿Te dieron "
                "recomendaciones demasiado básicas? ¿Faltó profundidad médica o seguimiento? "
                "¿No conectaron el problema con tu nivel de exigencia real? ¿Sentiste que no "
                "entendían tu estilo de vida, tu agenda o tus responsabilidades?",
                "type": "textarea",
                "is_required": False,
            },
        ],
    },
    {
        "title": "Bloque 4 · Costos, frecuencia y urgencia",
        "description": "",
        "questions": [
            {
                "code": "q12",
                "text": "¿Con qué frecuencia aparece este problema o esta preocupación?",
                "help_text": "",
                "type": "scale",
                "is_required": False,
                "choices": [
                    "Todos los días",
                    "Varias veces por semana",
                    "Una vez por semana",
                    "Solo en viajes o semanas de mucha presión",
                    "Rara vez",
                ],
            },
            {
                "code": "q13",
                "text": "¿Cuánto dinero, tiempo o energía estás invirtiendo actualmente para verte "
                "mejor, vivir más sano o rendir mejor?",
                "help_text": "Pistas: ¿Cuánto gastas al mes o al año en médicos, estudios, "
                "suplementos, terapias, ejercicio, nutrición, bienestar, estética o longevidad? "
                "¿Sientes que esa inversión está bien dirigida? ¿Hay algo en lo que gastas pero "
                "no estás seguro de que te esté ayudando?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q14",
                "text": "Si existiera una solución médica, personalizada y premium para atender tu "
                "prioridad principal, ¿qué tendría que incluir para que te pareciera valiosa?",
                "help_text": "Pistas: Evaluación profunda, estudios avanzados, biomarcadores. "
                "Análisis de sueño, estrés, metabolismo, inflamación, hormonas y hábitos. "
                "Plan anti-aging, longevidad o claridad mental según tu prioridad. Ruta médica "
                "clara, seguimiento cercano, reportes ejecutivos. Confidencialidad, acceso "
                "directo al médico, experiencia privada y discreta.",
                "type": "textarea",
                "is_required": False,
            },
        ],
    },
    {
        "title": "Bloque 5 · Deseo, presupuesto y decisión",
        "description": "",
        "questions": [
            {
                "code": "q15",
                "text": "Imagina que en 14 días pudieras tener un mapa claro de qué está afectando "
                "tu prioridad principal y una ruta médica personalizada. ¿Qué valor tendría eso "
                "para ti?",
                "help_text": "Pistas: ¿Qué tendría que pasar para que dijeras “esto sí vale la "
                "pena”? ¿Cuánto presupuesto considerarías razonable para una evaluación premium "
                "de este tipo? ¿Qué objeciones tendrías antes de decidir? ¿Quién más tendría que "
                "estar involucrado? ¿Qué te haría confiar en el proceso?",
                "type": "textarea",
                "is_required": False,
            },
            {
                "code": "q16",
                "text": "Si no haces nada y este problema continúa avanzando lentamente, ¿qué es lo "
                "que más te preocuparía perder?",
                "help_text": "Puedes elegir varias.",
                "type": "multi_choice",
                "is_required": False,
                "choices": [
                    "Juventud, atractivo, vitalidad o energía",
                    "Años de vida saludable, tranquilidad o control sobre tu futuro",
                    "Claridad mental, productividad, liderazgo o seguridad en ti mismo",
                ],
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Carga el cuestionario inicial de Entrevista Premium."

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
            title="Entrevista Premium · Anti-aging, Longevidad y Mente",
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
                    type=q["type"],
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
