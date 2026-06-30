from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode


User = get_user_model()


def request_password_reset(*, email, request):
    """Send reset instructions when an active account exists."""
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if not user or not user.has_usable_password():
        return

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    frontend_base_url = settings.FRONTEND_BASE_URL.rstrip("/")
    if not frontend_base_url:
        frontend_base_url = request.build_absolute_uri("/").rstrip("/")
    reset_url = f"{frontend_base_url}/reset-password/{uid}/{token}"
    send_mail(
        "Reset your password",
        f"Submit your new password to: {reset_url}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )


def get_reset_user(*, uid, token):
    """Return the user for a valid reset token, otherwise ``None``."""
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None
    return user if default_token_generator.check_token(user, token) else None


def confirm_password_reset(*, user, new_password):
    """Validate and apply a new password to a reset-token user."""
    validate_password(new_password, user)
    user.set_password(new_password)
    user.save(update_fields=("password",))
    return user
