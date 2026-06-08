# Entrevista Premium · Anti-aging, Longevidad y Mente

Aplicación de formulario/entrevista (autoservicio) con panel de administrador.

- **Backend:** Django + Django REST Framework
- **Base de datos:** PostgreSQL
- **Frontend:** React + Vite *(en construcción)*
- **Todo corre en Docker.**

## Cómo arrancar (en tu Mac)

1. Asegúrate de tener Docker abierto.
2. Copia las variables de entorno (solo la primera vez):
   ```bash
   cp .env.example .env   # luego edita .env con tus valores
   ```
3. Levanta los contenedores:
   ```bash
   docker compose up -d --build
   ```
4. Prepara la base de datos y carga las preguntas (solo la primera vez):
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_form
   docker compose exec backend python manage.py createsuperuser
   ```

## Direcciones

| Qué | URL |
|-----|-----|
| API | http://localhost:8010/api/ |
| Formulario (estructura) | http://localhost:8010/api/form/ |
| Admin de Django | http://localhost:8010/admin/ |
| Base de datos (desde el Mac) | localhost:5434 |

## Comandos útiles

```bash
docker compose logs -f backend     # ver registros del backend
docker compose down                # apagar
docker compose exec backend bash   # entrar al contenedor del backend
docker compose exec backend python manage.py seed_form --reset  # recargar preguntas
```

## Estructura

```
entrevista-premium/
├── docker-compose.yml
├── .env                  # secretos (NO se sube a git)
├── backend/
│   ├── config/           # configuración de Django
│   └── surveys/          # app principal (modelos, API, preguntas)
└── frontend/             # React + Vite (en construcción)
```
