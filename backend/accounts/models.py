import uuid as uuid_lib

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from simple_history.models import HistoricalRecords

from accounts.enums import RoleTypes as RoleType
from core.models import TimestampModel
from .managers import UserManager


class Role(TimestampModel):
    """Defines roles that can be assigned to users."""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    history = HistoricalRecords()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    email = models.EmailField('email address', unique=True)
    uuid = models.UUIDField(default=uuid_lib.uuid4, unique=True, editable=False)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=150)

    role = models.CharField(
        max_length=20, 
        choices=RoleType.choices,
        default=RoleType.APPLICANT
    )

    groups = models.ManyToManyField(
        Group, 
        blank=True, 
        related_name='custom_user_set'
    )
    user_permissions = models.ManyToManyField(
        Permission, 
        blank=True, 
        related_name='custom_user_permissions_set'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()
    history = HistoricalRecords()

    class Meta:
        ordering = ['email']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        self.username = self.email
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    @property
    def is_applicant(self):
        return self.role == RoleType.APPLICANT

    @property
    def is_reviewer(self):
        return self.role == RoleType.REVIEWER


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('PASSWORD_RESET', 'Password Reset'),
    )

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='audit_logs',
        help_text='User who performed the action'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    changes = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"{self.get_action_display()} on {self.content_type} by {self.user} at {self.timestamp}"
