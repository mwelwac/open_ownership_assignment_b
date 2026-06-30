from django.contrib.auth import get_user_model

from accounts.enums import RoleTypes
from applications.enums import ApplicationStatus, NotificationEventType
from applications.models import Notification


def _status_label(status: str) -> str:
    return ApplicationStatus(status).label


def _owner_notification_content(transition):
    application = transition.application
    if (
        transition.from_status == ApplicationStatus.UNDER_REVIEW
        and transition.to_status == ApplicationStatus.DRAFT
    ):
        return (
            NotificationEventType.CHANGES_REQUESTED,
            "Changes requested",
            f'A reviewer requested changes to "{application.title}".',
        )
    if transition.to_status == ApplicationStatus.UNDER_REVIEW:
        return (
            NotificationEventType.STATUS_CHANGED,
            "Application under review",
            f'"{application.title}" is now under review.',
        )
    if transition.to_status == ApplicationStatus.APPROVED:
        return (
            NotificationEventType.STATUS_CHANGED,
            "Application approved",
            f'"{application.title}" has been approved.',
        )
    if transition.to_status == ApplicationStatus.REJECTED:
        return (
            NotificationEventType.STATUS_CHANGED,
            "Application rejected",
            f'"{application.title}" has been rejected.',
        )
    return (
        NotificationEventType.STATUS_CHANGED,
        "Application status updated",
        f'"{application.title}" moved to {_status_label(transition.to_status)}.',
    )


def create_status_notifications(*, application, transition):
    """Create persisted notifications for the users affected by a workflow transition."""
    notifications = []

    if transition.actor_id != application.owner_id:
        event_type, title, message = _owner_notification_content(transition)
        notifications.append(
            Notification(
                recipient=application.owner,
                application=application,
                transition=transition,
                event_type=event_type,
                title=title,
                message=message,
            )
        )

    if transition.to_status == ApplicationStatus.SUBMITTED:
        reviewers = (
            get_user_model()
            .objects.filter(role=RoleTypes.REVIEWER, is_active=True)
            .exclude(id=transition.actor_id)
        )
        for reviewer in reviewers:
            notifications.append(
                Notification(
                    recipient=reviewer,
                    application=application,
                    transition=transition,
                    event_type=NotificationEventType.APPLICATION_SUBMITTED,
                    title="Application submitted",
                    message=f'"{application.title}" is ready for review.',
                )
            )

    if notifications:
        Notification.objects.bulk_create(notifications, ignore_conflicts=True)
