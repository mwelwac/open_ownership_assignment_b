# Azure VM Deployment

This project deploys as one Docker Compose stack on an Ubuntu Azure VM:

- `app`: Django API, session auth, and the built React frontend.
- `postgres`: PostgreSQL database with a persistent Docker volume.
- `nginx`: public HTTP reverse proxy.

## 1. Provision The VM

Create an Ubuntu LTS Azure VM and allow inbound traffic for:

- `22` for SSH. Restrict this to your own IP if possible.
- `80` for HTTP.
- `443` for HTTPS later, if you add TLS.

Assigning a DNS name to the VM public IP is recommended, even before HTTPS:

```text
your-vm-dns-name.region.cloudapp.azure.com
```

## 2. Install Docker On The VM

SSH into the VM, then install Docker and the Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in so your user can run Docker without `sudo`.

## 3. Clone The Repository

```bash
git clone <your-github-repo-url>
cd <repo-folder>
```

## 4. Configure Environment Variables

Create the real environment file:

```bash
cp .env.example .env
nano .env
```

Set at minimum:

- `SECRET_KEY` to a long random value.
- `ALLOWED_HOSTS` to include `localhost`, `127.0.0.1`, and your VM DNS name.
- `CSRF_TRUSTED_ORIGINS` to your public origin, including `http://` for the initial Nginx setup.
- `FRONTEND_BASE_URL` to your public origin.
- `POSTGRES_PASSWORD` to a strong password.

The provided Compose stack starts as HTTP-only through Nginx. Use:

```bash
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
SECURE_SSL_REDIRECT=False
```

After adding HTTPS, change the public URLs to `https://...`, set `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`, and usually set `SECURE_SSL_REDIRECT=True`.

## 5. Start The App

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

The `app` container runs `collectstatic` and `migrate` automatically on startup.

Create an admin user if needed:

```bash
docker compose exec app python manage.py createsuperuser
```

## 6. Update The Deployment

After pushing new code to GitHub:

```bash
git pull
docker compose up -d --build
docker compose logs -f app
```

## 7. Back Up PostgreSQL

Create a timestamped database dump:

```bash
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backups/caseman-$(date +%Y%m%d-%H%M%S).sql
```

Restore a dump:

```bash
docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < backups/<dump-file>.sql
```

## 8. Useful Checks

```bash
docker compose ps
docker compose logs app
docker compose logs nginx
docker compose exec app python manage.py check --deploy
docker compose exec postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```
