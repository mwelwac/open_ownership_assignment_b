from rest_framework.permissions import BasePermission

from accounts.enums import RoleTypes
from applications.enums import ApplicationStatus


class ApplicationPermission(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == "create":
            return request.user.role == RoleTypes.APPLICANT

        return True

    def has_object_permission(self, request, view, obj):
        if view.action in {"retrieve", "transition"}:
            return True

        if view.action in {"update", "partial_update", "destroy"}:
            return (
                request.user.role == RoleTypes.APPLICANT
                and obj.owner_id == request.user.id
                and obj.status == ApplicationStatus.DRAFT
            )

        return True
