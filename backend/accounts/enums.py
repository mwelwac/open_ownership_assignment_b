from django.db import models


class RoleTypes(models.TextChoices):
    APPLICANT = "APPLICANT", "Applicant"
    REVIEWER = "REVIEWER", "Reviewer"
