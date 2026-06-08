"""
Crea un superusuario para el panel a partir de variables de entorno, si no existe.

Útil en producción (Railway): define ADMIN_USERNAME y ADMIN_PASSWORD y el usuario
se crea automáticamente en el primer despliegue. Es idempotente (no duplica).
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crea un superusuario admin desde variables de entorno si no existe."

    def handle(self, *args, **options) -> None:
        User = get_user_model()
        username = os.environ.get("ADMIN_USERNAME")
        password = os.environ.get("ADMIN_PASSWORD")
        email = os.environ.get("ADMIN_EMAIL", "")

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    "ADMIN_USERNAME/ADMIN_PASSWORD no definidos; omito creación de admin."
                )
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f"El usuario '{username}' ya existe.")
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"✓ Superusuario '{username}' creado."))
