from django.test import TestCase

from accounts.enums import RoleTypes
from applications.enums import ApplicationStatus
from applications.models import Notification, StatusTransition
from applications.tests.factories import make_application, make_user
from applications.workflow.exceptions import CommentRequired, TransitionForbidden
from applications.workflow.service import perform_transition


class ApplicationWorkflowTests(TestCase):
    def setUp(self):
        self.applicant = make_user()
        self.reviewer = make_user(role=RoleTypes.REVIEWER)
        self.application = make_application(owner=self.applicant)

    def test_transition_updates_status_and_records_history(self):
        transition = perform_transition(
            self.application,
            self.applicant,
            ApplicationStatus.SUBMITTED,
        )

        self.application.refresh_from_db()
        self.assertEqual(self.application.status, ApplicationStatus.SUBMITTED)
        self.assertEqual(transition.from_status, ApplicationStatus.DRAFT)
        self.assertEqual(StatusTransition.objects.count(), 1)

    def test_rejection_requires_a_comment(self):
        self.application.status = ApplicationStatus.UNDER_REVIEW
        self.application.save(update_fields=("status",))

        with self.assertRaises(CommentRequired):
            perform_transition(
                self.application,
                self.reviewer,
                ApplicationStatus.REJECTED,
            )

    def test_reviewer_cannot_submit_an_applicants_draft(self):
        with self.assertRaises(TransitionForbidden):
            perform_transition(
                self.application,
                self.reviewer,
                ApplicationStatus.SUBMITTED,
            )

    def test_request_changes_creates_unread_notification_for_applicant(self):
        self.application.status = ApplicationStatus.UNDER_REVIEW
        self.application.save(update_fields=("status",))

        perform_transition(
            self.application,
            self.reviewer,
            ApplicationStatus.DRAFT,
            comment="Please upload a clearer attachment.",
        )

        notification = Notification.objects.get(recipient=self.applicant)
        self.assertEqual(notification.application, self.application)
        self.assertEqual(notification.event_type, "CHANGES_REQUESTED")
        self.assertEqual(notification.title, "Changes requested")
        self.assertFalse(notification.is_read)

    def test_submission_notifies_reviewers(self):
        perform_transition(
            self.application,
            self.applicant,
            ApplicationStatus.SUBMITTED,
        )

        notification = Notification.objects.get(recipient=self.reviewer)
        self.assertEqual(notification.application, self.application)
        self.assertEqual(notification.event_type, "APPLICATION_SUBMITTED")
