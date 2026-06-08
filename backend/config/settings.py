"""
Configuración de Django para el proyecto Entrevista Premium.

Los valores sensibles (llaves, contraseñas) se leen de variables de entorno
(archivo .env), nunca van escritos aquí.
"""
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Lectura de variables de entorno ---
env = environ.Env(
    DEBUG=(bool, False),
)
# Si existe un .env local (fuera de Docker) lo lee; en Docker llegan por environment.
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")

# Railway expone el dominio público en esta variable.
RAILWAY_DOMAIN = env("RAILWAY_PUBLIC_DOMAIN", default="")

if DEBUG:
    ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
    CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])
else:
    # En producción la app va detrás del proxy de confianza de Railway.
    # Permitimos todos los hosts (incluido el del healthcheck) para no rechazar peticiones.
    ALLOWED_HOSTS = ["*"]
    CSRF_TRUSTED_ORIGINS = ["https://*.railway.app", "https://*.up.railway.app"]
    if RAILWAY_DOMAIN:
        CSRF_TRUSTED_ORIGINS.append(f"https://{RAILWAY_DOMAIN}")


# --- Aplicaciones ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # Propias
    "surveys",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise sirve los archivos estáticos (frontend + admin) en producción.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# --- Base de datos ---
# En Railway, DATABASE_URL la inyecta el Postgres administrado.
DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
}


# --- Validación de contraseñas ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --- Internacionalización ---
LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Mexico_City"
USE_I18N = True
USE_TZ = True


# --- Archivos estáticos ---
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

# En producción, el frontend ya compilado vive en /app/spa y WhiteNoise lo sirve
# en la raíz del sitio (/, /assets/..., /background.jpg). En desarrollo no existe.
SPA_DIR = BASE_DIR / "spa"
if SPA_DIR.exists():
    WHITENOISE_ROOT = SPA_DIR
    WHITENOISE_INDEX_FILE = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Django REST Framework ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}


# --- CORS (qué orígenes del frontend pueden llamar a la API) ---
# En producción el frontend y la API comparten dominio, así que normalmente no hace falta.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True


# --- Seguridad en producción (detrás del proxy de Railway, HTTPS) ---
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
