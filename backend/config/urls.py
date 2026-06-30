"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from core.views import spa_index


handler404 = 'core.views.api_aware_not_found'
handler500 = 'core.views.api_aware_server_error'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(('config.api_urls', 'v1'), namespace='v1')),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='redoc'),
    re_path(r'^(?!api/|admin/|static/|media/).*$', spa_index, name='spa-index'),
]
