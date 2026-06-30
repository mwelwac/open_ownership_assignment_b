from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from simple_history.admin import SimpleHistoryAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import User, Role


@admin.register(Role)
class RoleAdmin(SimpleHistoryAdmin):
    list_display = ['code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name']
    ordering = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin, SimpleHistoryAdmin):
    """Custom admin for User model with email-based authentication."""

    add_form = CustomUserCreationForm
    form = CustomUserChangeForm

    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'role']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['email']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Role', {'fields': ('role',)}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )

    readonly_fields = ['date_joined', 'last_login', 'uuid']
    filter_horizontal = ['groups', 'user_permissions']