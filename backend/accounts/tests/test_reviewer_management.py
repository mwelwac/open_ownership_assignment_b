from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.enums import RoleTypes


class ReviewerManagementTests(TestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.staff = self.user_model.objects.create_user(
            email="staff@example.com",
            password="a-secure-test-password",
            first_name="Staff",
            last_name="Manager",
            is_staff=True,
        )
        self.applicant = self.user_model.objects.create_user(
            email="applicant@example.com",
            password="a-secure-test-password",
            first_name="App",
            last_name="Licant",
        )
        self.client = APIClient()

    def test_current_user_exposes_staff_metadata_for_frontend_authorization(self):
        self.client.force_authenticate(self.staff)

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIs(response.json()["is_staff"], True)
        self.assertIs(response.json()["is_superuser"], False)

    def test_staff_can_create_reviewer_accounts(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            "/api/v1/auth/reviewers/",
            {
                "email": "reviewer@example.com",
                "first_name": "Review",
                "last_name": "User",
                "password": "Strongest-Password-2026!",
                "password_confirm": "Strongest-Password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reviewer = self.user_model.objects.get(email="reviewer@example.com")
        self.assertEqual(reviewer.role, RoleTypes.REVIEWER)
        self.assertFalse(reviewer.is_staff)
        self.assertTrue(reviewer.check_password("Strongest-Password-2026!"))
        self.assertEqual(response.json()["role"], RoleTypes.REVIEWER)

    def test_staff_can_list_reviewer_accounts_only(self):
        self.user_model.objects.create_user(
            email="reviewer@example.com",
            password="a-secure-test-password",
            first_name="Review",
            last_name="User",
            role=RoleTypes.REVIEWER,
        )
        self.client.force_authenticate(self.staff)

        response = self.client.get("/api/v1/auth/reviewers/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [record["email"] for record in response.json()["results"]]
        self.assertEqual(emails, ["reviewer@example.com"])

    def test_non_staff_user_cannot_create_reviewers(self):
        self.client.force_authenticate(self.applicant)

        response = self.client.post(
            "/api/v1/auth/reviewers/",
            {
                "email": "blocked@example.com",
                "first_name": "Blocked",
                "last_name": "User",
                "password": "Strongest-Password-2026!",
                "password_confirm": "Strongest-Password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(self.user_model.objects.filter(email="blocked@example.com").exists())
