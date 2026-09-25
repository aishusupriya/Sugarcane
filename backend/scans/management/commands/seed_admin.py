from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Create or update the local AgriScan admin user."

    def handle(self, *args, **options):
        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(username="shubha", defaults={"is_staff": True, "is_superuser": True})
        user.is_staff = True
        user.is_superuser = True
        user.set_password("shubha123")
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Admin user shubha {'created' if created else 'updated'}"))
