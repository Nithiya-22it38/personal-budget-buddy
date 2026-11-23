import os

from django.core.management.base import BaseCommand

from apps.authentication.models import User


class Command(BaseCommand):
    help = 'Create or update the admin account from environment variables'

    def handle(self, *args, **options):
        username = os.getenv('ADMIN_USERNAME')
        email = os.getenv('ADMIN_EMAIL')
        password = os.getenv('ADMIN_PASSWORD')

        if not username or not email or not password:
            self.stdout.write('ADMIN_USERNAME, ADMIN_EMAIL or ADMIN_PASSWORD is missing. Skipped.')
            return

        user = User.objects.filter(username=username).first()
        if user is None:
            user = User(username=username)

        user.email = email
        user.role = 'admin'
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        self.stdout.write('Admin account is ready: ' + username)