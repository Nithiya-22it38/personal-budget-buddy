from django.core.management.base import BaseCommand

from apps.categories.models import Category

DEFAULT_CATEGORIES = [
    'Food',
    'Travel',
    'Shopping',
    'Education',
    'Entertainment',
    'Miscellaneous',
]


class Command(BaseCommand):
    help = 'Create the default expense categories'

    def handle(self, *args, **options):
        for name in DEFAULT_CATEGORIES:
            Category.objects.get_or_create(name=name, user=None)
        self.stdout.write('Default categories are ready.')