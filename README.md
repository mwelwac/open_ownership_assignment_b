# CaseMan

CaseMan is my submission for **Assignment B - Submission & Approval Workflow** from the Full-Stack Developer technical assessment. It is a two-sided application where applicants create and submit applications, and reviewers process submitted applications through a backend-enforced status workflow.

Live URL: [http://40.113.163.41](http://40.113.163.41)<br>
Repository: [https://github.com/mwelwac/open_ownership_assignment_b](https://github.com/mwelwac/open_ownership_assignment_b)

## Documentation

- [System design](./SYSTEM_DESIGN.md)
- [User guide](./USER_GUIDE.md)
- [Azure VM deployment guide](./DEPLOYMENT.md)

## Implemented Scope

- Applicant registration, login, account view, password change, and password reset flow.
- Reviewer registration and reviewer login.
- Applicant application CRUD while an application is still in `DRAFT`.
- Reviewer queue with status tabs, search, filters, ordering, and pagination.
- Backend-enforced workflow transitions with clear API errors for illegal transitions.
- Transition audit trail shown on the application detail page.
- Optional file attachments with server-side file type and size validation.
- In-app notifications for status changes and submitted applications.
- OpenAPI schema and Swagger UI under `/api/v1/schema/` and `/api/v1/docs/`.
- Docker Compose deployment with Django, PostgreSQL, and Nginx.

## Test Access

The live deployment supports self-service test access:

- Applicant: create an account at `/register`.
- Reviewer: create an account at `/reviewer/register`.

No shared live passwords are committed to the repository. For local seeded development data, the fixture users below all use:

```text
Password123!
```

| Role | Email |
| --- | --- |
| Applicant | `applicant@example.com` |
| Applicant | `applicant2@example.com` |
| Reviewer | `reviewer@example.com` |
| Admin reviewer | `admin@example.com` |

## Local Run: Docker

This is the fastest way to run the same shape as the deployed app.

```bash
cp .env.example .env
```

Edit `.env` for local use:

```env
SECRET_KEY=local-development-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=http://localhost
FRONTEND_BASE_URL=http://localhost
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
SECURE_SSL_REDIRECT=False
POSTGRES_PASSWORD=local-development-password
```

Then build and start the stack:

```bash
docker compose up -d --build
```

Optional seed data:

```bash
docker compose exec app python manage.py loaddata caseman_dev_seed
```

Create an admin user if needed:

```bash
docker compose exec app python manage.py createsuperuser
```

Open:

```text
http://localhost
```

## Local Run: Development Mode

Use this mode when actively working on the frontend and backend separately.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Backend:

```bash
cd backend
python -m venv venv
venv/bin/pip install -r requirements/dev.txt
export SECRET_KEY=local-development-secret-key
export DEBUG=True
# Match this password to POSTGRES_PASSWORD in your .env file.
export DATABASE_URL=postgres://caseman:local-development-password@127.0.0.1:5432/caseman
venv/bin/python manage.py migrate
venv/bin/python manage.py loaddata caseman_dev_seed
venv/bin/python manage.py runserver
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite dev server proxies `/api`, `/admin`, `/media`, and `/static` requests to Django.

## Tests

Backend:

```bash
cd backend
venv/bin/python manage.py test accounts applications core
```

Frontend:

```bash
cd frontend
npm test
```

Additional checks used during deployment preparation:

```bash
cd frontend
npm run build

cd ../backend
venv/bin/python manage.py makemigrations --check --dry-run
venv/bin/python manage.py check
```

## Data Model Summary

The main persistent models are:

- `accounts.User`: custom user model with email login and a role of `APPLICANT` or `REVIEWER`.
- `applications.Application`: applicant-owned request with title, category, description, optional amount, optional attachment, and current status.
- `applications.StatusTransition`: immutable audit record for each status move, including actor, old status, new status, comment, and timestamp.
- `applications.Notification`: in-app notification generated when applications are submitted or statuses change.

See [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) for the full design notes and trade-offs.

## Key Design Decisions

- Django session authentication is used because the deployed frontend and backend are served from the same origin.
- Workflow rules live in a dedicated transition policy/service layer instead of being spread across views or serializers.
- Every mutation is checked server-side; UI controls are only a convenience layer.
- `StatusTransition` is append-only so the application detail page can show a reliable audit trail.
- PostgreSQL is used in Docker and deployment; SQLite is only a development fallback when `DEBUG=True`.
- The React build is served by Django in the production container to keep the deployed system simple for the assessment.

## Trade-offs And Future Work

- The current deployment uses a single VM with Docker Compose. It is simple and easy to inspect, but a production system should use managed PostgreSQL, automated backups, HTTPS, monitoring, and secret management.
- Reviewer self-registration is open to keep assessment testing simple. A production workflow should restrict reviewer creation to admins.
- File attachments are stored on the VM via a Docker volume. Production storage should use private object storage such as Azure Blob Storage.
- Password reset uses console-style email behavior in development. Production email delivery should be configured before real use.
- The workflow supports the required review cycle, including return for changes, but it does not yet version application field changes between resubmissions.

## AI Tool Usage

I used OpenAI ChatGPT/Codex during the assignment for:

- exploring implementation approaches and deployment options;
- reviewing and tightening code structure;
- generating and refining tests;
- debugging environment and Docker deployment issues;
- drafting documentation.

I verified the work by reading the generated code, running backend and frontend tests, checking migrations, building the frontend, running Django system checks, building the Docker stack, and manually deploying the app to an Azure VM.
