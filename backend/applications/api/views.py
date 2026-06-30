import mimetypes
from pathlib import Path

from django.http import FileResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from applications.models import Application, Notification
from applications.api.permissions import ApplicationPermission
from applications.api.serializers import (
    ApplicationSerializer,
    MarkAllReadSerializer,
    NotificationSerializer,
    TransitionErrorSerializer,
    TransitionRequestSerializer,
    UnreadCountSerializer,
)
from applications.selectors import applications_visible_to
from applications.workflow import TransitionError, perform_transition


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = (IsAuthenticated, ApplicationPermission)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ("status", "category", "owner")
    search_fields = ("title", "description", "owner__email")
    ordering_fields = ("created_at", "updated_at", "title", "amount", "status")
    ordering = ("-created_at",)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Application.objects.all()
        return applications_visible_to(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @extend_schema(
        request=TransitionRequestSerializer,
        responses={
            200: ApplicationSerializer,
            400: TransitionErrorSerializer,
            403: TransitionErrorSerializer,
            409: TransitionErrorSerializer,
        },
    )
    @action(detail=True, methods=("post",))
    def transition(self, request, pk=None):
        application = self.get_object()
        serializer = TransitionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            perform_transition(
                application=application,
                actor=request.user,
                **serializer.validated_data,
            )
        except TransitionError as exc:
            return Response(
                {"code": exc.code, "detail": exc.message, "errors": None},
                status=exc.http_status,
            )

        application.refresh_from_db()
        return Response(
            ApplicationSerializer(application, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        responses={
            (200, "application/octet-stream"): OpenApiResponse(
                response=OpenApiTypes.BINARY,
                description="The private attachment file.",
            ),
            404: TransitionErrorSerializer,
        }
    )
    @action(detail=True, methods=("get",), url_path="attachment")
    def attachment(self, request, pk=None):
        application = self.get_object()
        if not application.attachment:
            raise NotFound("This application has no attachment.")
        filename = Path(application.attachment.name).name
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        return FileResponse(
            application.attachment.open("rb"),
            as_attachment=True,
            filename=filename,
            content_type=content_type,
        )


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        return Notification.objects.filter(recipient=self.request.user).select_related(
            "application"
        )

    @extend_schema(responses={200: NotificationSerializer})
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(responses={200: UnreadCountSerializer})
    @action(detail=False, methods=("get",), url_path="unread-count")
    def unread_count(self, request):
        return Response({"count": self.get_queryset().filter(is_read=False).count()})

    @extend_schema(request=None, responses={200: NotificationSerializer})
    @action(detail=True, methods=("post",), url_path="read")
    def read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=("is_read", "read_at", "updated_at"))
        return Response(NotificationSerializer(notification).data)

    @extend_schema(request=None, responses={200: MarkAllReadSerializer})
    @action(detail=False, methods=("post",), url_path="read-all")
    def read_all(self, request):
        now = timezone.now()
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=now,
            updated_at=now,
        )
        return Response({"updated": updated})
