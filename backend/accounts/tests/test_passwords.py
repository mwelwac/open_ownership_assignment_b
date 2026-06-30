from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordTests(TestCase):
    def test_password_change_keeps_the_current_session(self):
        user = get_user_model().objects.create_user(
            email="change@example.com",
            password="Old-Password-2026!",
            first_name="Password",
            last_name="Change",
        )
        self.client.force_login(user)
        response = self.client.post(
            "/api/v1/auth/password/change/",
            {
                "current_password": "Old-Password-2026!",
                "new_password": "New-Password-2026!",
                "new_password_confirm": "New-Password-2026!",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("New-Password-2026!"))

    @override_settings(FRONTEND_BASE_URL="https://portal.example.com")
    def test_password_reset_is_non_enumerating_and_changes_password(self):
        user = get_user_model().objects.create_user(
            email="reset@example.com",
            password="Old-Password-2026!",
            first_name="Password",
            last_name="Reset",
        )
        response = self.client.post(
            "/api/v1/auth/password/reset/",
            {"email": user.email},
            content_type="application/json",
        )
        missing = self.client.post(
            "/api/v1/auth/password/reset/",
            {"email": "missing@example.com"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(missing.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.json(), missing.json())
        self.assertEqual(len(mail.outbox), 1)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        self.assertIn(
            f"https://portal.example.com/reset-password/{uid}/{token}",
            mail.outbox[0].body,
        )
        self.assertNotIn("/api/v1/auth/password/reset/", mail.outbox[0].body)
        confirm = self.client.post(
            f"/api/v1/auth/password/reset/{uid}/{token}/",
            {
                "new_password": "Reset-Password-2026!",
                "new_password_confirm": "Reset-Password-2026!",
            },
            content_type="application/json",
        )
        self.assertEqual(confirm.status_code, status.HTTP_204_NO_CONTENT)
        user.refresh_from_db()
        self.assertTrue(user.check_password("Reset-Password-2026!"))
