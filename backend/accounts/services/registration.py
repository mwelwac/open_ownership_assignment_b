from accounts.enums import RoleTypes
from accounts.models import User


def register_applicant(*, password, **user_data):
    """Create a public-registration user with the only permitted role."""
    return User.objects.create_user(
        password=password,
        role=RoleTypes.APPLICANT,
        **user_data,
    )
