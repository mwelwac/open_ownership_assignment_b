from rest_framework.routers import DefaultRouter

from applications.api.views import ApplicationViewSet, NotificationViewSet


router = DefaultRouter()
router.register("applications", ApplicationViewSet, basename="application")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = router.urls
