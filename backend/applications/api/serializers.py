from pathlib import Path

from django.core.validators import FileExtensionValidator
from django.urls import reverse
from rest_framework import serializers

from applications.models import Application, Notification, StatusTransition


class ActorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)


class StatusTransitionSerializer(serializers.ModelSerializer):
    actor = ActorSerializer(read_only=True)

    class Meta:
        model = StatusTransition
        fields = (
            "id",
            "actor",
            "from_status",
            "to_status",
            "comment",
            "created_at",
        )
        read_only_fields = fields


class ApplicationSerializer(serializers.ModelSerializer):
    owner = ActorSerializer(read_only=True)
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    transitions = StatusTransitionSerializer(many=True, read_only=True)
    attachment = serializers.FileField(
        write_only=True,
        required=False,
        allow_null=True,
        validators=(FileExtensionValidator(("pdf", "jpg", "jpeg", "png")),),
    )
    attachment_name = serializers.SerializerMethodField()
    attachment_download_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "owner",
            "title",
            "category",
            "description",
            "amount",
            "attachment",
            "attachment_name",
            "attachment_download_url",
            "status",
            "status_display",
            "transitions",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "status",
            "status_display",
            "transitions",
            "created_at",
            "updated_at",
        )

    def validate_attachment(self, attachment):
        if attachment is None:
            return attachment
        if attachment.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Attachments may not exceed 10 MB.")
        allowed_types = {"application/pdf", "image/jpeg", "image/png"}
        content_type = getattr(attachment, "content_type", None)
        if content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF, JPEG, and PNG files are allowed.")
        header = attachment.read(8)
        attachment.seek(0)
        signatures = {
            "application/pdf": (b"%PDF-",),
            "image/jpeg": (b"\xff\xd8\xff",),
            "image/png": (b"\x89PNG\r\n\x1a\n",),
        }
        if not any(header.startswith(signature) for signature in signatures[content_type]):
            raise serializers.ValidationError("The file contents do not match its declared type.")
        return attachment

    def get_attachment_name(self, obj) -> str | None:
        return Path(obj.attachment.name).name if obj.attachment else None

    def get_attachment_download_url(self, obj) -> str | None:
        if not obj.attachment:
            return None
        request = self.context.get("request")
        path = reverse("v1:application-attachment", kwargs={"pk": obj.pk})
        return request.build_absolute_uri(path) if request else path


class TransitionRequestSerializer(serializers.Serializer):
    to_status = serializers.CharField(max_length=20)
    comment = serializers.CharField(required=False, allow_blank=True, default="")


class TransitionErrorSerializer(serializers.Serializer):
    code = serializers.CharField()
    detail = serializers.CharField()
    errors = serializers.DictField(
        child=serializers.JSONField(),
        allow_empty=True,
        allow_null=True,
    )


class UnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=0)


class MarkAllReadSerializer(serializers.Serializer):
    updated = serializers.IntegerField(min_value=0)


class NotificationSerializer(serializers.ModelSerializer):
    application_id = serializers.IntegerField(source="application.id", read_only=True)
    application_title = serializers.CharField(source="application.title", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "event_type",
            "title",
            "message",
            "application_id",
            "application_title",
            "is_read",
            "read_at",
            "created_at",
        )
        read_only_fields = fields
