# Desplegar en Railway 🚂

Esta app se despliega como **un solo servicio web** (Django sirve la API + el
formulario + el panel ya compilados) más una **base de datos PostgreSQL** de Railway.
Resultado: **una sola URL** para tu cliente, sin problemas de CORS.

- Formulario (cliente): `https://TU-DOMINIO/`
- Panel de administrador: `https://TU-DOMINIO/admin`
- Admin de Django (respaldo): `https://TU-DOMINIO/django-admin/`

---

## Paso 1 · Sube el código a GitHub

Railway despliega desde un repositorio. Si aún no lo tienes en GitHub:

```bash
cd ~/Desktop/entrevista-premium
# (ya está inicializado y con un commit)
git remote add origin https://github.com/TU-USUARIO/entrevista-premium.git
git branch -M main
git push -u origin main
```

## Paso 2 · Crea el proyecto en Railway

1. Entra a [railway.app](https://railway.app) → **New Project**.
2. **Deploy from GitHub repo** → elige `entrevista-premium`.
3. Railway detecta el `Dockerfile` y empieza a construir (déjalo; configuramos las
   variables en el paso 4 antes de que termine de servir).

## Paso 3 · Agrega la base de datos PostgreSQL

1. Dentro del proyecto: **New** → **Database** → **Add PostgreSQL**.
2. Railway crea el servicio Postgres y una variable `DATABASE_URL`.

## Paso 4 · Configura las variables del servicio web

En el servicio de la app → pestaña **Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` *(referencia al Postgres)* |
| `SECRET_KEY` | una llave larga y secreta (ver abajo cómo generarla) |
| `DEBUG` | `False` |
| `ADMIN_USERNAME` | `admin` *(o el que quieras)* |
| `ADMIN_PASSWORD` | una contraseña fuerte |
| `ADMIN_EMAIL` | tu correo |

> `DJANGO_ALLOWED_HOSTS` y el dominio se configuran **solos** (la app lee
> `RAILWAY_PUBLIC_DOMAIN` que Railway provee automáticamente).

**Generar `SECRET_KEY`** (en tu Mac):
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```
Copia el resultado y pégalo como valor de `SECRET_KEY`.

## Paso 5 · Genera el dominio público

En el servicio web → **Settings** → **Networking** → **Generate Domain**.
Railway te da una URL tipo `https://entrevista-premium-production.up.railway.app`.

## Paso 6 · Despliega y prueba

Railway reconstruye con las variables. En el arranque, la app sola:
1. Aplica migraciones.
2. Junta los archivos estáticos.
3. Crea el usuario admin (con `ADMIN_USERNAME`/`ADMIN_PASSWORD`).
4. Carga las 18 preguntas iniciales (solo la primera vez).

Cuando termine, abre:
- `https://TU-DOMINIO/` → el formulario.
- `https://TU-DOMINIO/admin` → el panel (inicia sesión con tu admin).

---

## Actualizar la app

Cada vez que hagas cambios:
```bash
git add -A
git commit -m "mis cambios"
git push
```
Railway detecta el push y **vuelve a desplegar solo**. Tus preguntas editadas en
producción **no se borran** (el cargador inicial solo corre si no existen).

## Notas útiles

- **Ver registros:** en Railway, servicio web → pestaña **Deploy logs** / **Logs**.
- **Cambiar las preguntas iniciales:** edita desde el panel `/admin` → "Editar
  formulario" (los cambios viven en la base de datos de Railway).
- **Reiniciar las preguntas a la versión de fábrica:** en Railway, servicio web →
  pestaña con la terminal/`Run command` → `python manage.py seed_form --reset`
  (⚠️ borra las entrevistas).
- **Cambiar el fondo:** reemplaza `frontend/public/background.jpg`, haz commit y push.
