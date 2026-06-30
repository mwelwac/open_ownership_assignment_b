# System Design

## Goal

CaseMan implements Assignment B: a submission and approval workflow for two roles.

- Applicants create, edit, submit, and track their own applications.
- Reviewers process submitted applications, move them into review, approve them, reject them, or return them for changes.
- The backend enforces the workflow and stores an audit trail for every status change.

## Architecture

The repository is a monorepo with separate source applications:

```text
frontend/   React, TypeScript, Vite
backend/    Django, Django REST Framework, PostgreSQL
```

For production deployment, the frontend is built into static assets and served by Django from the same container. Nginx proxies public HTTP traffic to Gunicorn.

```text
Browser
  -> Nginx
  -> Django/Gunicorn
  -> PostgreSQL
```

This keeps authentication and CSRF handling simple because the browser and API are same-origin in deployment.

## Backend Components

### Accounts

The `accounts` app owns authentication, registration, password actions, and roles.

Main model:

- `User`: custom Django user using email as the login field. The `role` field is either `APPLICANT` or `REVIEWER`.

Important API capabilities:

- CSRF cookie initialization.
- Login and logout.
- Applicant registration.
- Reviewer registration.
- Current user endpoint.
- Password change and reset endpoints.

### Applications

The `applications` app owns application data, workflow transitions, permissions, and notifications.

Main models:

- `Application`
  - owner
  - title
  - category
  - description
  - optional amount
  - optional attachment
  - current status

- `StatusTransition`
  - application
  - actor
  - from status
  - to status
  - comment
  - timestamp

- `Notification`
  - recipient
  - application
  - transition
  - event type
  - title and message
  - read state

## Workflow

Statuses:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
```

Allowed transitions:

| From | To | Actor | Comment required |
| --- | --- | --- | --- |
| `DRAFT` | `SUBMITTED` | Owner applicant | No |
| `SUBMITTED` | `UNDER_REVIEW` | Reviewer | No |
| `UNDER_REVIEW` | `APPROVED` | Reviewer | No |
| `UNDER_REVIEW` | `REJECTED` | Reviewer | Yes |
| `UNDER_REVIEW` | `DRAFT` | Reviewer | Yes |

Additional rules:

- Applicants can only submit their own draft applications.
- Applicants cannot edit after an application leaves `DRAFT`.
- Reviewers cannot review their own applications.
- Illegal transitions return structured errors.
- Each successful transition writes a `StatusTransition` record.

The transition logic is centralized in:

```text
backend/applications/workflow/policy.py
backend/applications/workflow/service.py
```

The policy file defines what is allowed. The service validates the destination status, role, ownership rule, comment requirement, writes the audit record, updates the application, and creates notifications inside a database transaction.

## Authorization Model

The UI hides actions that are not available to the signed-in user, but the backend remains authoritative.

Server-side checks include:

- Applicants can create applications.
- Applicants can update or delete only their own `DRAFT` applications.
- Reviewers can access the review queue and perform reviewer transitions.
- Transition rules are enforced by the workflow service even if a user calls the API directly.

## API Design

The API is RESTful and versioned under:

```text
/api/v1/
```

Key route groups:

- `/api/v1/auth/`
- `/api/v1/applications/`
- `/api/v1/notifications/`

The project also exposes OpenAPI documentation:

```text
/api/v1/schema/
/api/v1/docs/
/api/v1/redoc/
```

API errors use a structured envelope with:

```json
{
  "code": "example_code",
  "detail": "Human readable message.",
  "errors": null
}
```

## Frontend Design

The frontend is a React/Vite app using TypeScript.

Key choices:

- React Router for client-side routes.
- TanStack Query for server state and cache invalidation.
- React Hook Form and Zod for form state and client-side validation.
- Relative API paths such as `/api/v1/...`, so the same code works in same-origin deployment.

Important screens:

- Applicant login and registration.
- Reviewer login and registration.
- Application list.
- Application detail with status history.
- Application create/edit form.
- Reviewer queue.
- Account page.

## Data Integrity

Data consistency is handled through:

- database migrations committed to the repository;
- foreign keys between applications, users, transitions, and notifications;
- transaction-wrapped status transitions;
- `select_for_update()` during transitions to avoid concurrent status changes;
- server-side file validation for supported attachment types;
- append-only transition records for audit history.

## Deployment Design

The deployed system uses Docker Compose on an Azure VM:

```text
nginx      public HTTP reverse proxy
app        Django/Gunicorn plus built React assets
postgres   PostgreSQL database
```

Persistent Docker volumes are used for:

- PostgreSQL data.
- Uploaded media files.

The deployment is intentionally simple for the assessment. It is easy to inspect over SSH and does not require a separate container registry.

## Testing Strategy

Backend tests cover:

- authentication and CSRF behavior;
- registration and password flows;
- reviewer management;
- application API behavior;
- workflow legal and illegal transitions;
- authorization failures;
- notification creation.

Frontend tests cover:

- API client behavior;
- auth pages;
- application list behavior;
- reviewer management form behavior;
- notification bell behavior;
- utility/model logic.

## Trade-offs

- A single VM deployment is fast and transparent, but managed services would be safer for long-running production use.
- Reviewer self-registration helps reviewers test the app without manual admin setup, but a production system should restrict reviewer provisioning.
- Same-origin session auth keeps the app simple, but separate frontend/backend hosting would require stricter CORS and cookie configuration or a token-based auth approach.
- Attachments are stored on local Docker volume storage. Production should use private object storage with backup and lifecycle policies.
- The workflow records status history, but application field revisions are not versioned on each resubmission.

## Production Improvements

With more time I would add:

- HTTPS with certificate renewal.
- Azure Database for PostgreSQL Flexible Server.
- Azure Blob Storage for private attachments.
- automated database backups and restore testing.
- stricter reviewer provisioning.
- application revision snapshots.
- structured application logging and monitoring.
- CI pipeline for tests and Docker image builds.
