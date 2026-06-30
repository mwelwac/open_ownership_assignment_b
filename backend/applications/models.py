from django.conf import settings
from django.db import models

from applications.enums import (
    ApplicationCategory as Category,
    ApplicationStatus as Status,
    NotificationEventType,
)
from core.models import TimestampModel


class Application(TimestampModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name="applications"
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=32, choices=Category.choices)
    description = models.TextField(blank=True)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    attachment = models.FileField(
        upload_to="attachments/", 
        null=True, 
        blank=True)
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.DRAFT
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"


class StatusTransition(models.Model):
    application = models.ForeignKey(
        Application, 
        on_delete=models.CASCADE, 
        related_name="transitions"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name="transitions_performed"
    )
    from_status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        blank=True
    )
    to_status = models.CharField(max_length=20, choices=Status.choices)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.application_id}: {self.from_status or '∅'} → {self.to_status}"


class Notification(TimestampModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    transition = models.ForeignKey(
        StatusTransition,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    event_type = models.CharField(
        max_length=32,
        choices=NotificationEventType.choices,
    )
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["recipient", "transition", "event_type"],
                name="unique_notification_per_transition_recipient_event",
            )
        ]

    def __str__(self) -> str:
        return f"{self.recipient_id}: {self.title}"
