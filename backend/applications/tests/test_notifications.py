from rest_framework import status
from rest_framework.test import APITestCase

from applications.enums import ApplicationStatus
from applications.models import Notification, StatusTransition
from applications.tests.factories import make_application, make_user


class NotificationAPITests(APITestCase):
    def setUp(self):
        self.applicant = make_user(email="applicant@example.com")
        self.other_user = make_user(email="other@example.com")
        self.reviewer = make_user(email="reviewer@example.com", role="REVIEWER")
        self.application = make_application(owner=self.applicant)
        self.transition = StatusTransition.objects.create(
            application=self.application,
            actor=self.reviewer,
            from_status=ApplicationStatus.UNDER_REVIEW,
            to_status=ApplicationStatus.DRAFT,
            comment="Please revise the attachment.",
        )
        self.notification = Notification.objects.create(
            recipient=self.applicant,
            application=self.application,
            transition=self.transition,
            event_type="CHANGES_REQUESTED",
            title="Changes requested",
            message="A reviewer requested changes.",
        )
        Notification.objects.create(
            recipient=self.other_user,
            application=self.application,
            transition=self.transition,
            event_type="CHANGES_REQUESTED",
            title="Not yours",
            message="This should not be visible.",
        )
        self.client.force_authenticate(self.applicant)

    def test_user_can_list_only_their_notifications(self):
        response = self.client.get("/api/v1/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Changes requested")
        self.assertEqual(response.data["results"][0]["application_id"], self.application.id)

    def test_user_can_get_unread_count_and_mark_notification_read(self):
        unread = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(unread.status_code, status.HTTP_200_OK)
        self.assertEqual(unread.data["count"], 1)

        read = self.client.post(f"/api/v1/notifications/{self.notification.id}/read/")
        self.assertEqual(read.status_code, status.HTTP_200_OK)
        self.assertTrue(read.data["is_read"])
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)
        self.assertIsNotNone(self.notification.read_at)

    def test_user_can_mark_all_notifications_read(self):
        Notification.objects.create(
            recipient=self.applicant,
            application=self.application,
            transition=StatusTransition.objects.create(
                application=self.application,
                actor=self.reviewer,
                from_status=ApplicationStatus.SUBMITTED,
                to_status=ApplicationStatus.UNDER_REVIEW,
            ),
            event_type="STATUS_CHANGED",
            title="Application under review",
            message="Review started.",
        )

        response = self.client.post("/api/v1/notifications/read-all/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated"], 2)
        self.assertEqual(
            Notification.objects.filter(recipient=self.applicant, is_read=False).count(),
            0,
        )
