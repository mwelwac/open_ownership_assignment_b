# CaseMan

## Local backend database

The backend is configured for PostgreSQL by default.

```bash
cp .env.example .env
docker compose up -d postgres
```

If you are using an existing local PostgreSQL installation instead of Docker, create a `caseman` database/user and keep `DATABASE_URL` in `.env` pointed at that database.

Then prepare the Django database:

```bash
cd backend
venv/bin/python manage.py makemigrations
venv/bin/python manage.py migrate
venv/bin/python manage.py loaddata caseman_dev_seed
```

Migrations are intentionally ignored in this repository, so generate them locally before running `migrate`.

## Seed users

The development fixture creates these users. All use the password `Password123!`.

| Role | Email |
| --- | --- |
| Applicant | `applicant@example.com` |
| Applicant | `applicant2@example.com` |
| Reviewer | `reviewer@example.com` |
| Admin reviewer | `admin@example.com` |

Do not use the seed fixture in production.
