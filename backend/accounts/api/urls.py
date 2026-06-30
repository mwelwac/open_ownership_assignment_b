from django.urls import path

from accounts.api.views import (
    CSRFTokenView,
    CurrentUserView,
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ReviewerListCreateView,
    ReviewerRegistrationView,
    RegistrationView,
)


urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("register/", RegistrationView.as_view(), name="register"),
    path("reviewer/register/", ReviewerRegistrationView.as_view(), name="reviewer-register"),
    path("reviewers/", ReviewerListCreateView.as_view(), name="reviewers"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password/reset/<str:uid>/<str:token>/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
