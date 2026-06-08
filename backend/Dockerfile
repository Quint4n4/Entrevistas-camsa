# Imagen base de Python (estable y ligera)
FROM python:3.12-slim

# Buenas prácticas para Python en contenedores
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias del sistema necesarias para PostgreSQL
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalamos primero las dependencias (aprovecha la caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copiamos el código
COPY . .

EXPOSE 8000
