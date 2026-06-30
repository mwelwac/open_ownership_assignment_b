from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status


class RegistrationTests(TestCase):
    def test_registration_creates_only_an_applicant_and_starts_a_session(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "new@example.com",
                "first_name": "New",
                "last_name": "Applicant",
                "password": "Strongest-Password-2026!",
                "password_confirm": "Strongest-Password-2026!",
                "role": "REVIEWER",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email="new@example.com")
        self.assertEqual(user.role, "APPLICANT")
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)

    def test_reviewer_registration_creates_reviewer_and_starts_a_session(self):
        response = self.client.post(
            "/api/v1/auth/reviewer/register/",
            {
                "email": "reviewer@example.com",
                "first_name": "Review",
                "last_name": "User",
                "password": "Strongest-Password-2026!",
                "password_confirm": "Strongest-Password-2026!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email="reviewer@example.com")
        self.assertEqual(user.role, "REVIEWER")
        self.assertFalse(user.is_staff)
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)
