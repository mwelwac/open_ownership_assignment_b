from django.contrib import admin

from applications.models import Application, Notification, StatusTransition


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "category", "status", "updated_at")
    list_filter = ("status", "category")
    search_fields = ("title", "owner__email")


@admin.register(StatusTransition)
class StatusTransitionAdmin(admin.ModelAdmin):
    list_display = ("application", "actor", "from_status", "to_status", "created_at")
    list_filter = ("from_status", "to_status")
    search_fields = ("application__title", "actor__email", "comment")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "application", "event_type", "is_read", "created_at")
    list_filter = ("event_type", "is_read")
    search_fields = ("title", "message", "recipient__email", "application__title")
