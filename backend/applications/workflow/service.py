from django.db import transaction

from applications.enums import ApplicationStatus as Status
from accounts.enums import RoleTypes as Role
from applications.workflow.exceptions import (
    CommentRequired,
    IllegalTransition,
    InvalidStatus,
    TransitionForbidden,
)
from applications.workflow.policy import TRANSITION_POLICY

from applications.models import Application, StatusTransition
from applications.notifications import create_status_notifications


@transaction.atomic
def perform_transition(application, actor, to_status, comment=""):
    application = (
        Application.objects
        .select_for_update()
        .get(pk=application.pk)
    )

    from_status = application.status
    comment = (comment or "").strip()

    # Validate destination status
    if to_status not in Status.values:
        raise InvalidStatus(f"'{to_status}' is not a valid status.")

    # Look up the transition policy
    policy = TRANSITION_POLICY.get((from_status, to_status))

    if policy is None:
        raise IllegalTransition(
            f"Cannot move from {from_status} to {to_status}."
        )

    # Check role
    if actor.role not in policy["roles"]:
        raise TransitionForbidden(
            f"Role '{actor.role}' cannot perform this transition."
        )

    # Business rules
    if actor.role == Role.APPLICANT:
        if application.owner_id != actor.id:
            raise TransitionForbidden(
                "You can only submit your own application."
            )

    elif actor.role == Role.REVIEWER:
        if application.owner_id == actor.id:
            raise TransitionForbidden(
                "You cannot review your own application."
            )

    # Comment requirement
    if policy["comment_required"] and not comment:
        raise CommentRequired(
            "A comment is required for this transition."
        )

    # Record history
    transition = StatusTransition.objects.create(
        application=application,
        actor=actor,
        from_status=from_status,
        to_status=to_status,
        comment=comment,
    )

    # Apply transition
    application.status = to_status
    application.save(update_fields=["status", "updated_at"])
    create_status_notifications(application=application, transition=transition)

    return transition
