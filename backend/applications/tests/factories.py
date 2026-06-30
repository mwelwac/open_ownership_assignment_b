from itertools import count

from django.contrib.auth import get_user_model

from accounts.enums import RoleTypes
from applications.enums import ApplicationCategory
from applications.models import Application


_user_sequence = count(1)


def make_user(*, role=RoleTypes.APPLICANT, **overrides):
    sequence = next(_user_sequence)
    values = {
        "email": f"user{sequence}@example.com",
        "password": "test-password",
        "first_name": "Test",
        "last_name": f"User {sequence}",
        "role": role,
    }
    values.update(overrides)
    return get_user_model().objects.create_user(**values)


def make_application(*, owner, **overrides):
    values = {
        "title": "Reserve a company name",
        "category": ApplicationCategory.NAME_CLEARANCE,
    }
    values.update(overrides)
    return Application.objects.create(owner=owner, **values)
