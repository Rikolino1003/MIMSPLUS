from rest_framework import routers
from .views import MensajeViewSet, ResenaViewSet

router = routers.DefaultRouter()
router.register(r'mensajes', MensajeViewSet)
router.register(r'resenas', ResenaViewSet)

urlpatterns = router.urls
