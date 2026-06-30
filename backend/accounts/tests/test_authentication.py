import base64
from unittest import mock

from axes.models import AccessAttempt
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import UserRateThrottle

from applications.api.views import ApplicationViewSet


class AuthenticationSecurityTests(TestCase):
    def setUp(self):
        self.password = "a-secure-test-password"
        self.user = get_user_model().objects.create_user(
            email="security@example.com",
            password=self.password,
            first_name="Security",
            last_name="Test",
        )

    def test_failed_logins_are_recorded_and_locked_after_limit(self):
        for _ in range(4):
            response = self.client.post(
                "/api/v1/auth/login/",
                {"email": self.user.email, "password": "wrong-password"},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "wrong-password"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(
            response.json(),
            {
                "code": "throttled",
                "detail": "Too many failed login attempts. Try again later.",
                "errors": None,
            },
        )
        attempt = AccessAttempt.objects.get(username=self.user.email)
        self.assertEqual(attempt.failures_since_start, 5)

    def test_basic_authentication_is_not_accepted(self):
        credentials = base64.b64encode(
            f"{self.user.email}:{self.password}".encode()
        ).decode()

        response = self.client.get(
            "/api/v1/applications/", HTTP_AUTHORIZATION=f"Basic {credentials}"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_json_login_current_user_and_logout(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": self.password},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["email"], self.user.email)

        current_user = self.client.get("/api/v1/auth/me/")
        self.assertEqual(current_user.status_code, status.HTTP_200_OK)

        logout_response = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(logout_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(
            self.client.get("/api/v1/auth/me/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_login_requires_csrf_for_browser_clients(self):
        client = APIClient(enforce_csrf_checks=True)
        rejected = client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": self.password},
            format="json",
        )
        self.assertEqual(rejected.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(rejected.json()["code"], "csrf_failed")

        client.get("/api/v1/auth/csrf/")
        token = client.cookies["csrftoken"].value
        accepted = client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": self.password},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)

    def test_validation_errors_use_the_common_envelope(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "not-an-email", "password": "wrong"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["detail"], "Request validation failed.")
        self.assertIn("email", response.json()["errors"])


class OneRequestPerMinuteThrottle(UserRateThrottle):
    rate = "1/minute"


class APIThrottleTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            email="throttle@example.com",
            password="a-secure-test-password",
            first_name="Throttle",
            last_name="Test",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def tearDown(self):
        cache.clear()

    @mock.patch.object(
        ApplicationViewSet,
        "throttle_classes",
        (OneRequestPerMinuteThrottle,),
    )
    def test_authenticated_requests_are_throttled(self):
        first_response = self.client.get("/api/v1/applications/")
        second_response = self.client.get("/api/v1/applications/")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
