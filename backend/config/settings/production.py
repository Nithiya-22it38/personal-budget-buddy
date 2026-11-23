import os

from .base import *


def read_list(name):
    # turns "a.com, b.com" in an environment variable into ['a.com', 'b.com']
    items = []
    for item in os.getenv(name, '').split(','):
        item = item.strip()
        if item != '':
            items.append(item)
    return items


DEBUG = False

# the app must not start without these
if not SECRET_KEY:
    raise ValueError('SECRET_KEY is missing. Set it as an environment variable.')

if not os.getenv('DB_NAME'):
    raise ValueError('Database settings are missing. Set DB_NAME and the other DB_ variables.')

ALLOWED_HOSTS = read_list('ALLOWED_HOSTS')
CORS_ALLOWED_ORIGINS = read_list('CORS_ALLOWED_ORIGINS')
CSRF_TRUSTED_ORIGINS = read_list('CSRF_TRUSTED_ORIGINS')

# static files (the admin panel's CSS and JavaScript)
STATIC_ROOT = BASE_DIR / 'staticfiles'
MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 3600