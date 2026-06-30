from django.urls import include, path


app_name = "v1"

urlpatterns = [
    path("auth/", include("accounts.api.urls")),
    path("", include("applications.api.urls")),
]
