from types import SimpleNamespace

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from accounts.enums import RoleTypes
from applications.api.permissions import ApplicationPermission
from applications.enums import ApplicationStatus
from applications.tests.factories import make_application, make_user


class ApplicationPermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = ApplicationPermission()
        self.applicant = make_user()
        self.reviewer = make_user(role=RoleTypes.REVIEWER)

    def request_for(self, user):
        request = self.factory.get("/")
        request.user = user
        return request

    def test_only_applicants_can_create(self):
        view = SimpleNamespace(action="create")
        self.assertTrue(
            self.permission.has_permission(self.request_for(self.applicant), view)
        )
        self.assertFalse(
            self.permission.has_permission(self.request_for(self.reviewer), view)
        )

    def test_only_owner_can_edit_a_draft(self):
        application = make_application(owner=self.applicant)
        view = SimpleNamespace(action="partial_update")
        self.assertTrue(
            self.permission.has_object_permission(
                self.request_for(self.applicant), view, application
            )
        )

        application.status = ApplicationStatus.SUBMITTED
        self.assertFalse(
            self.permission.has_object_permission(
                self.request_for(self.applicant), view, application
            )
        )
