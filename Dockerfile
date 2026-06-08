# Imagen de PRODUCCIÓN para Railway: compila el frontend y lo sirve junto con Django.
# (En desarrollo seguimos usando docker-compose con los Dockerfile de backend/ y frontend/.)

# ===== Etapa 1: compilar el frontend (React + Vite) =====
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Usa frontend/.env.production (VITE_API_URL=/api). Genera /fe/dist
RUN npm run build

# ===== Etapa 2: backend (Django) que sirve la API + el frontend compilado =====
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# El frontend compilado: Django/WhiteNoise lo sirven desde /app/spa
COPY --from=frontend /fe/dist ./spa

# Arranque: migraciones -> estáticos -> admin (si hay env) -> datos iniciales -> servidor
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py ensure_admin && python manage.py seed_form && gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000}"]
