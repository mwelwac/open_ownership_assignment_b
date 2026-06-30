from django.db import models


class ApplicationStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class NotificationEventType(models.TextChoices):
    STATUS_CHANGED = "STATUS_CHANGED", "Status changed"
    CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes requested"
    APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED", "Application submitted"


class ApplicationCategory(models.TextChoices):
    NAME_CLEARANCE = "NAME_CLEARANCE", "Name Clearance"
    INCORPORATION = "INCORPORATION", "Incorporation"
    BO_DECLARATION = "BO_DECLARATION", "Business Ownership Declaration"
    DETAILS_UPDATE = "DETAILS_UPDATE", "Details Update"
