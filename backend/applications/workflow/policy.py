from applications.enums import ApplicationStatus as Status
from accounts.enums import RoleTypes as Role


TRANSITION_POLICY = {
    (Status.DRAFT, Status.SUBMITTED): {
        "roles": {Role.APPLICANT},
        "comment_required": False,
    },

    (Status.SUBMITTED, Status.UNDER_REVIEW): {
        "roles": {Role.REVIEWER},
        "comment_required": False,
    },

    (Status.UNDER_REVIEW, Status.APPROVED): {
        "roles": {Role.REVIEWER},
        "comment_required": False,
    },

    (Status.UNDER_REVIEW, Status.REJECTED): {
        "roles": {Role.REVIEWER},
        "comment_required": True,
    },

    (Status.UNDER_REVIEW, Status.DRAFT): {
        "roles": {Role.REVIEWER},
        "comment_required": True,
    },
}
