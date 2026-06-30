from axes.signals import user_locked_out
from django.dispatch import receiver
from rest_framework.exceptions import Throttled


@receiver(user_locked_out)
def raise_api_lockout(*args, request=None, **kwargs):
    if request is not None and request.path.startswith("/api/v1/"):
        raise Throttled(detail="Too many failed login attempts. Try again later.")
