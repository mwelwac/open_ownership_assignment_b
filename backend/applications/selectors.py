from accounts.enums import RoleTypes
from applications.models import Application


def applications_visible_to(user):
    """Return the applications visible to a user, failing closed by role."""
    queryset = Application.objects.select_related("owner").prefetch_related(
        "transitions__actor"
    )
    if user.role == RoleTypes.APPLICANT:
        return queryset.filter(owner=user)
    if user.role == RoleTypes.REVIEWER:
        return queryset
    return queryset.none()
