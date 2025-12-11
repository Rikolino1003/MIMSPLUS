"""
Django settings for backend project.
"""

from pathlib import Path
from datetime import timedelta
from decouple import config 

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-siunr9o((qd)0g4s@e1szy^w8$f%9_om+xvzxi&c(raq&q0!=7'

DEBUG = True

# Hosts permitidos
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Aplicaciones instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Apps externas
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'django_extensions',
    # Apps del proyecto
    'usuarios',
    'inventario',
    'facturacion',
    'pedidos',
    'mensajes',
    'droguerias',
    'reportes',  
]

# Modelo de usuario personalizado
AUTH_USER_MODEL = 'usuarios.Usuario'

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    # CORS debe ir arriba del CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Permitir que React envie cookies
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # React Vite
    "http://localhost:3000",  # React CRA
]

# Cookies locales
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# URLs y templates
ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Base de datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Validaciones de contraseña
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Idioma y zona horaria
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# Archivos estáticos
STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

# Configuración JWT (dura 1 día, ajustable)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Configuración CORS
CORS_ALLOW_ALL_ORIGINS = True  # permite peticiones desde cualquier dominio (para desarrollo)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]
CORS_EXPOSE_HEADERS = [
    'content-disposition',
    'content-type',
    'content-length',
]

# Configuración para manejar las preflight requests
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 horas
CORS_ALLOW_PRIVATE_NETWORK = True

# Configuración para manejar archivos binarios (PDFs)
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB


# ==============================
#  CONFIGURACIÓN DE CORREOS
# ==============================

# Usar Gmail directamente
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# Credenciales desde variables de entorno (.env)
EMAIL_HOST_USER = config("EMAIL_USER", default="alfonsocastro4365@gmail.com")
EMAIL_HOST_PASSWORD = config("EMAIL_PASSWORD", default="")

# Debug temporal: verificar que se leen las variables
print("=" * 50)
print("DEBUG EMAIL CONFIG:")
print(f"EMAIL_HOST_USER: {EMAIL_HOST_USER}")
print(f"EMAIL_PASSWORD (primeros 4): {EMAIL_HOST_PASSWORD[:4] if EMAIL_HOST_PASSWORD else 'VACIO'}...")
print(f"EMAIL_PASSWORD length: {len(EMAIL_HOST_PASSWORD) if EMAIL_HOST_PASSWORD else 0}")
print("=" * 50)

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER