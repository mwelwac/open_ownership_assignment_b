# User Guide

Live URL: [http://40.113.163.41](http://40.113.163.41)

CaseMan has two user roles:

- Applicant: creates and submits applications.
- Reviewer: reviews submitted applications and records decisions.

## Creating Test Accounts

The live deployment supports self-service registration.

Applicant:

1. Open `/register`.
2. Enter first name, last name, email, password, and password confirmation.
3. Submit the form.
4. The app signs you in and opens the applications page.

Reviewer:

1. Open `/reviewer/register`.
2. Enter first name, last name, email, password, and password confirmation.
3. Submit the form.
4. The app signs you in as a reviewer.

For local seeded development data, these users are available after loading the fixture:

| Role | Email | Password |
| --- | --- | --- |
| Applicant | `applicant@example.com` | `Password123!` |
| Applicant | `applicant2@example.com` | `Password123!` |
| Reviewer | `reviewer@example.com` | `Password123!` |
| Admin reviewer | `admin@example.com` | `Password123!` |

## Applicant Workflow

### Create An Application

1. Sign in as an applicant.
2. Open **My applications**.
3. Select **New application**.
4. Enter a title.
5. Select a category.
6. Optionally add a description, amount, and attachment.
7. Save the form.

New applications are saved as `DRAFT`.

### Edit A Draft

1. Open a `DRAFT` application.
2. Select **Edit**.
3. Update the details.
4. Save the form.

Applicants can edit only their own draft applications. Once an application leaves `DRAFT`, the backend rejects edit requests.

### Submit An Application

1. Open a draft application.
2. Select **Submit**.
3. Confirm the action.

The status changes from `DRAFT` to `SUBMITTED`, and reviewers can see the application in the review queue.

### Respond To Changes Requested

If a reviewer returns an application for changes:

1. Open the application.
2. Read the reviewer comment near the top of the detail page.
3. Select **Edit**.
4. Update the draft.
5. Submit it again.

The previous status changes remain visible in the audit trail.

## Reviewer Workflow

### Open The Queue

1. Sign in as a reviewer.
2. Open **Review queue**.
3. Use the queue tabs:
   - **Submitted**
   - **Under review**
   - **All applications**
4. Use search, category filtering, and sorting when needed.

### Start Review

1. Open a `SUBMITTED` application.
2. Select **Start review**.
3. Confirm the action.

The status changes to `UNDER_REVIEW`.

### Approve

1. Open an `UNDER_REVIEW` application.
2. Select **Approve**.
3. Confirm the action.

The status changes to `APPROVED`.

### Reject

1. Open an `UNDER_REVIEW` application.
2. Select **Reject**.
3. Enter a comment.
4. Confirm the action.

Reject requires a comment. The backend rejects the transition if the comment is missing.

### Return For Changes

1. Open an `UNDER_REVIEW` application.
2. Select **Return for changes**.
3. Enter a comment explaining what the applicant must fix.
4. Confirm the action.

The status returns to `DRAFT`, and the applicant can edit and resubmit the application.

## Audit Trail

Each application detail page includes a status history. It shows:

- who performed the transition;
- the previous status;
- the new status;
- the comment, when supplied;
- the timestamp.

This audit trail is written by the backend during each successful transition.

## Notifications

The notification bell shows workflow events relevant to the current user, including:

- applications submitted for reviewer attention;
- status changes;
- returned-for-changes messages.

Users can mark individual notifications as read or mark all notifications as read.

## Attachments

Applicants may add one optional attachment.

Supported file types:

- PDF
- JPEG
- PNG

Maximum size:

```text
10 MB
```

Attachments are downloaded through a protected API endpoint, so users must be signed in and authorized to view the application.

## Admin

Django admin is available at:

```text
/admin/
```

Create a superuser with:

```bash
docker compose exec app python manage.py createsuperuser
```

Admin access is useful for inspecting users, applications, transitions, notifications, and uploaded file metadata.
