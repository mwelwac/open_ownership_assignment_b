import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.enums import RoleTypes
from applications.enums import ApplicationStatus
from applications.models import StatusTransition
from applications.tests.factories import make_application, make_user


class ApplicationAPITests(APITestCase):
    def setUp(self):
        self.applicant = make_user(
            email="applicant@example.com",
            password="test-password",
            first_name="Ada",
            last_name="Applicant",
            role=RoleTypes.APPLICANT,
        )
        self.other_applicant = make_user(
            email="other@example.com",
            password="test-password",
            first_name="Otto",
            last_name="Other",
            role=RoleTypes.APPLICANT,
        )
        self.reviewer = make_user(
            email="reviewer@example.com",
            password="test-password",
            first_name="Rita",
            last_name="Reviewer",
            role=RoleTypes.REVIEWER,
        )
        self.client.force_authenticate(self.applicant)

    def create_application(self, owner=None, **overrides):
        return make_application(owner=owner or self.applicant, **overrides)

    def test_authentication_is_required(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/applications/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_applicant_can_create_and_only_list_own_applications(self):
        self.create_application(owner=self.other_applicant, title="Not mine")

        create_response = self.client.post(
            "/api/v1/applications/",
            {
                "title": "My application",
                "category": "INCORPORATION",
                "status": ApplicationStatus.APPROVED,
            },
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["owner"]["id"], self.applicant.id)
        self.assertEqual(create_response.data["status"], ApplicationStatus.DRAFT)
        list_response = self.client.get("/api/v1/applications/")
        self.assertEqual(list_response.data["count"], 1)

    def test_applicant_can_only_edit_own_draft(self):
        draft = self.create_application()
        response = self.client.patch(
            f"/api/v1/applications/{draft.id}/", {"title": "Updated title"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        draft.status = ApplicationStatus.SUBMITTED
        draft.save()
        response = self.client.patch(
            f"/api/v1/applications/{draft.id}/", {"title": "Too late"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_workflow_uses_service_and_returns_transition_history(self):
        application = self.create_application()
        submit_response = self.client.post(
            f"/api/v1/applications/{application.id}/transition/",
            {"to_status": ApplicationStatus.SUBMITTED},
        )
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_response.data["status"], ApplicationStatus.SUBMITTED)

        self.client.force_authenticate(self.reviewer)
        review_response = self.client.post(
            f"/api/v1/applications/{application.id}/transition/",
            {"to_status": ApplicationStatus.UNDER_REVIEW},
        )
        self.assertEqual(review_response.status_code, status.HTTP_200_OK)
        reject_response = self.client.post(
            f"/api/v1/applications/{application.id}/transition/",
            {"to_status": ApplicationStatus.REJECTED, "comment": "Incomplete"},
        )
        self.assertEqual(reject_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reject_response.data["transitions"]), 3)
        self.assertEqual(StatusTransition.objects.count(), 3)

    def test_transition_errors_have_stable_error_codes(self):
        application = self.create_application(status=ApplicationStatus.UNDER_REVIEW)
        self.client.force_authenticate(self.reviewer)
        response = self.client.post(
            f"/api/v1/applications/{application.id}/transition/",
            {"to_status": ApplicationStatus.REJECTED},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "comment_required")

    def test_reviewer_cannot_create_application(self):
        self.client.force_authenticate(self.reviewer)
        response = self.client.post(
            "/api/v1/applications/",
            {"title": "Reviewer draft", "category": "INCORPORATION"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reviewer_can_filter_search_and_order_paginated_results(self):
        self.create_application(title="Zulu draft")
        self.create_application(
            owner=self.other_applicant,
            title="Alpha submitted",
            status=ApplicationStatus.SUBMITTED,
        )
        self.client.force_authenticate(self.reviewer)

        response = self.client.get(
            "/api/v1/applications/",
            {"status": ApplicationStatus.SUBMITTED, "search": "Alpha", "ordering": "title"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Alpha submitted")

    def test_permission_errors_use_the_common_envelope(self):
        application = self.create_application(status=ApplicationStatus.SUBMITTED)
        response = self.client.patch(
            f"/api/v1/applications/{application.id}/", {"title": "Too late"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "permission_denied")
        self.assertIsNone(response.data["errors"])

    def test_unknown_roles_fail_closed(self):
        self.reviewer.role = "UNEXPECTED"
        self.reviewer.save(update_fields=("role",))
        self.client.force_authenticate(self.reviewer)
        response = self.client.get("/api/v1/applications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_attachment_is_validated_and_delivered_through_private_endpoint(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            upload = SimpleUploadedFile(
                "evidence.pdf",
                b"%PDF-1.4\nprivate evidence",
                content_type="application/pdf",
            )
            create_response = self.client.post(
                "/api/v1/applications/",
                {
                    "title": "Application with evidence",
                    "category": "INCORPORATION",
                    "attachment": upload,
                },
                format="multipart",
            )
            self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
            self.assertNotIn("attachment", create_response.data)
            self.assertEqual(create_response.data["attachment_name"], "evidence.pdf")

            application_id = create_response.data["id"]
            download = self.client.get(
                f"/api/v1/applications/{application_id}/attachment/"
            )
            self.assertEqual(download.status_code, status.HTTP_200_OK)
            self.assertEqual(b"".join(download.streaming_content), b"%PDF-1.4\nprivate evidence")

            self.client.force_authenticate(self.other_applicant)
            denied = self.client.get(
                f"/api/v1/applications/{application_id}/attachment/"
            )
            self.assertEqual(denied.status_code, status.HTTP_404_NOT_FOUND)

    def test_attachment_content_must_match_declared_type(self):
        fake_pdf = SimpleUploadedFile(
            "fake.pdf", b"this is not a PDF", content_type="application/pdf"
        )
        response = self.client.post(
            "/api/v1/applications/",
            {
                "title": "Bad upload",
                "category": "INCORPORATION",
                "attachment": fake_pdf,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("attachment", response.data["errors"])
