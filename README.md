# Todo Board (drag & drop)

Kanban-style todo app: drag cards between **To Do / In Progress / Done** and reorder within a column.

| Layer | Tech |
| --- | --- |
| Frontend | React 19 + TypeScript (Vite), SWR, React Hook Form + Zod, dnd-kit |
| Backend | Node.js + Express + TypeScript, Zod validation |
| Database | PostgreSQL via Prisma ORM |

## Setup

1. Create a database: `createdb todo_dnd` (or any name).
2. `cp server/.env.example server/.env` and set `DATABASE_URL` to your credentials.
3. Install and migrate:
   ```bash
   npm run install:all
   npm run db:migrate
   ```
4. Run both (two terminals):
   ```bash
   npm run dev:server   # http://localhost:4000
   npm run dev:client   # http://localhost:5173  (proxies /api to :4000)
   ```

## API

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/todos` | |
| POST | `/api/todos` | `{ title, description?, status? }` |
| PATCH | `/api/todos/:id` | `{ title?, description? }` |
| PATCH | `/api/todos/:id/move` | `{ status, afterId }` (`afterId` = card to sit after, `null` = top) |
| DELETE | `/api/todos/:id` | |

## How ordering works

Each todo has a float `position`. A drop sends only `{status, afterId}`; the server puts the card
midway between its new neighbours, so only one row is written per drag. The client updates SWR's
cache optimistically and rolls back if the request fails.

## Docker

```bash
cp .env.example .env        # set POSTGRES_PASSWORD
docker compose up --build   # http://localhost:8080
```

Runs Postgres, a one-shot `migrate` job, the API and non-root nginx serving the built client and
proxying `/api`. `POSTGRES_PASSWORD` is required; `POSTGRES_USER`, `POSTGRES_DB` and `WEB_PORT` are optional.




Deploy a PERN Application
Beginner's Guide: AWS EC2 + Docker + GitHub Self-Hosted Runner + Nginx + SSL

A reusable, step-by-step handover document for another developer or project owner

Before you start

This guide explains how to deploy an existing PERN application (PostgreSQL, Express, React, Node.js) to an Ubuntu EC2 virtual machine. It assumes the application repository already contains a working Dockerfile for each app component and a Docker Compose file. The exact Dockerfile, Compose file and GitHub Actions workflow YAML are project-specific and are intentionally not included here.

You need access to the GitHub repository and permission to configure repository settings/secrets.

You need an AWS account and permission to create EC2, Security Groups, key pairs and (optionally) an Elastic IP.

You need a Docker Hub account if the CI/CD workflow pushes images there.

You need the application's environment variables, database credentials and migration instructions from the project owner.

Important: Never copy another person's PEM private key, passwords, tokens, Docker Hub credentials or GitHub secrets. Each recipient must create their own credentials.

1. Collect project details

Before creating the server, write down the values for this project. Do not guess these values.

Value to collect

Example / where to find it

GitHub repository URL

https://github.com/<OWNER>/<REPOSITORY>

Branch to deploy

<BRANCH_NAME>

Frontend host port

3000 (confirm in Compose)

Backend host port

4000 (confirm in Compose)

Database name/user/password

Get securely from project owner; do not put password in this document

Docker Hub image names

<DOCKERHUB_USER>/<IMAGE_NAME>

Required environment variables

Read project README / .env.example

Health-check URL/path

Example: /health

Important: Do not send real database passwords, API keys, PEM files or GitHub tokens in a shared document.

2. Create an Ubuntu EC2 instance

Open AWS Console → EC2 → Launch instance.

Give the instance a name, e.g. pern-app-server.

Choose a supported Ubuntu Server LTS AMI.

Choose an instance size suitable for the app and expected traffic. Check current AWS pricing before launch.

Create a new key pair. Select PEM for OpenSSH and download it once. Store it safely.

Create/select a Security Group with these inbound rules:

Type

Port

Source

SSH

22

Your current public IP only

HTTP

80

0.0.0.0/0

HTTPS

443

0.0.0.0/0

Launch the instance and note its Public IPv4 address.

Important: Do not open PostgreSQL port 5432 to the internet. Initially, do not open frontend/backend ports 3000/4000 publicly if you plan to access the app only through host Nginx. If troubleshooting requires temporary access, restrict it to your IP and remove it afterwards.

3. Connect to EC2 from Windows

Open PowerShell. Replace the key path and public IP with your own:

ssh -i "C:\path\to\your-key.pem" ubuntu@<EC2_PUBLIC_IP>

If prompted to trust the host, type yes. You should see a prompt similar to ubuntu@ip-...:~$.

4. Update Ubuntu and install Docker

Run these commands inside the EC2 SSH session:

sudo apt update

sudo apt upgrade -y

sudo apt install -y ca-certificates curl git

Install Docker Engine and the Compose plugin using the current official Docker instructions for Ubuntu. One supported apt-repository method is:

sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \

  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \

  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \

  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker

docker --version

docker compose version

Optional: allow the ubuntu user to run Docker without sudo:

sudo usermod -aG docker $USER

newgrp docker

docker ps

Important: Log out and reconnect if group membership is not applied. Never use chmod 666 on the Docker socket; Docker access is effectively root-level access.

5. Prepare the application on EC2

Clone the repository using the correct repository URL and branch:

git clone -b <BRANCH_NAME> https://github.com/<OWNER>/<REPOSITORY>.git

cd <REPOSITORY>

Create the production environment file using the project's .env.example or deployment instructions. Use strong unique passwords. Example placeholder only:

nano .env

# Add the environment variables required by THIS application.

# Example variable names may include:

# POSTGRES_USER=<DB_USER>

# POSTGRES_PASSWORD=<STRONG_UNIQUE_PASSWORD>

# POSTGRES_DB=<DB_NAME>

# CLIENT_ORIGINS=<ALLOWED_FRONTEND_ORIGIN>

Important: Do not paste the example values literally. Use the exact variable names expected by the project's Compose file and backend. Ensure .env is excluded from Git.

6. Start the application with Docker Compose

The Compose file must define the app's services, database volume, environment variables, ports and health checks. The following commands assume a compose.yaml or docker-compose.yml exists in the current directory:

docker compose config

docker compose up -d --build

docker compose ps

If the project uses prebuilt images rather than local builds, follow its release instructions, authenticate to the image registry if needed, and use:

docker compose pull

docker compose up -d

Inspect logs if a service is unhealthy:

docker compose logs --tail=100

docker compose logs --tail=100 <SERVICE_NAME>

Test the backend using the health route defined by the app:

curl http://127.0.0.1:<BACKEND_HOST_PORT>/health

Important: Never run docker compose down -v as a routine restart command. The -v option can delete named database volumes and destroy persisted database data.

7. Configure GitHub Actions Self-Hosted Runner

A self-hosted runner allows GitHub Actions to run deployment jobs on the EC2 machine. Use GitHub's own setup page because the runner download URL, version and one-time registration token change.

Open the GitHub repository → Settings → Actions → Runners.

Select New self-hosted runner.

Choose Linux and the correct architecture shown for the EC2 instance.

Follow the commands displayed by GitHub to download, extract and configure the runner. Run them in the EC2 terminal.

When asked for a runner name, use a recognizable name. Add labels if the workflow expects specific labels.

Install it as a service using the exact service commands shown by GitHub, then verify it appears as Idle/Online in repository settings.

In the repository's Actions workflow, the deployment job must target the self-hosted runner and use the correct project directory.

Add required secrets through GitHub repository → Settings → Secrets and variables → Actions. Common examples (only if the workflow needs them):

Docker Hub username and access token.

Database credentials or other deployment secrets, if the workflow explicitly uses them.

AWS credentials only if the workflow accesses AWS services. Prefer an IAM role on EC2 for AWS access instead of long-lived access keys.

Important: A self-hosted runner can execute repository code on your server. Only use it with repositories and branches you trust. Protect the deployment branch and restrict who can change workflows.

8. Install host Nginx

The React container may already run its own Nginx to serve static files. Install a separate Nginx on the EC2 host to receive public HTTP/HTTPS requests and proxy them to the Docker-published local ports.

sudo apt install -y nginx

sudo systemctl enable --now nginx

sudo systemctl status nginx

Confirm the ports:

sudo ss -ltnp | grep -E ':80|:443|:3000|:4000'

9. Configure a hostname for testing

For a quick test without buying a domain, nip.io can map a hostname containing the EC2 public IP to that IP. Replace the sample address with your own:

getent hosts <EC2_PUBLIC_IP>.nip.io

curl -I http://<EC2_PUBLIC_IP>.nip.io

Example only: if the public IP is 203.0.113.10, the hostname is 203.0.113.10.nip.io. Use the actual IP, not this documentation example.

Important: A nip.io hostname is useful for testing only. It exposes the IP in the hostname and is not a domain you own. For a long-term service, purchase a domain and point its DNS A record to an Elastic IP.

10. Configure Nginx reverse proxy

This example assumes frontend is published on host port 3000, backend on host port 4000, backend health route is /health, and API routes begin with /api/. Change these values if the project differs.

Create a site configuration. Replace <HOSTNAME> with the nip.io hostname or your own domain:

sudo tee /etc/nginx/sites-available/pern-app > /dev/null <<'EOF'

server {

    listen 80;

    listen [::]:80;

    server_name <HOSTNAME>;

 

    location /api/ {

        proxy_pass http://127.0.0.1:4000;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

    }

 

    location /health {

        proxy_pass http://127.0.0.1:4000;

        proxy_set_header Host $host;

        proxy_set_header X-Forwarded-Proto $scheme;

    }

 

    location / {

        proxy_pass http://127.0.0.1:3000;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

    }

}

EOF

Enable the site and remove the default site link:

sudo ln -sfn /etc/nginx/sites-available/pern-app /etc/nginx/sites-enabled/pern-app

sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t

sudo systemctl reload nginx

Test the frontend and backend through Nginx:

curl -I http://<HOSTNAME>/

curl http://<HOSTNAME>/health

Important: The proxy_pass for /api/ has no trailing slash so the /api path prefix is preserved. Confirm that this matches the backend route structure. If the backend API does not use /api, adjust the Nginx locations accordingly.

11. Enable free HTTPS with Let's Encrypt and Certbot

Before requesting a certificate, verify that the hostname resolves to the EC2 public IP and that inbound TCP 80 and 443 are allowed in the Security Group. The HTTP hostname must be reachable from the public internet.

sudo apt update

sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d <HOSTNAME>

During setup, enter a valid email address, agree to the terms, and choose the HTTP-to-HTTPS redirect option if prompted.

After Certbot reports success, test:

curl -I https://<HOSTNAME>/

curl https://<HOSTNAME>/health

sudo certbot certificates

sudo certbot renew --dry-run

Important: Let's Encrypt certificates are time-limited and must renew. Certbot normally configures a systemd timer on Ubuntu packages; the dry-run command tests renewal. Keep port 80 reachable for HTTP-01 validation/renewal.

12. After deployment: essential security checklist

Use a domain you own and an Elastic IP for a stable public address.

Keep SSH port 22 restricted to trusted administrator IP addresses.

Keep public inbound ports 3000 and 4000 closed after Nginx proxy is verified.

Do not expose PostgreSQL port 5432 publicly.

For stronger isolation, bind Docker published frontend/backend ports to 127.0.0.1 and verify Nginx still works.

Use strong database credentials and keep secrets out of Git and logs.

Create automated PostgreSQL backups to a separate private S3 bucket and test restoration.

Enable CloudWatch alarms/log monitoring and keep Ubuntu/Docker updated.

Use least-privilege IAM roles for AWS access.

Protect the production branch and restrict self-hosted runner access.

13. Troubleshooting quick commands

# Check containers and health

docker ps

docker compose ps

 

# View logs

docker compose logs --tail=100

docker compose logs --tail=100 <SERVICE_NAME>

 

# Check Nginx

sudo systemctl status nginx

sudo nginx -t

sudo journalctl -u nginx --no-pager -n 50

 

# Check ports

sudo ss -ltnp | grep -E ':80|:443|:3000|:4000'

 

# Test frontend/backend locally on EC2

curl -I http://127.0.0.1:3000/

curl http://127.0.0.1:4000/health

 

# Test public hostname

curl -I https://<HOSTNAME>/

curl https://<HOSTNAME>/health

 

# Check certificate and renewal

sudo certbot certificates

sudo certbot renew --dry-run

14. Deployment handover checklist

☐ EC2 instance launched and SSH access tested.

☐ Security Group configured with SSH restricted, HTTP and HTTPS open.

☐ Docker Engine and Docker Compose installed.

☐ Application environment variables created securely.

☐ PostgreSQL persistent volume verified.

☐ Frontend, backend and database containers healthy.

☐ GitHub self-hosted runner online and protected.

☐ Host Nginx reverse proxy routes frontend and API correctly.

☐ HTTPS certificate issued and browser shows a valid lock.

☐ Certificate renewal dry-run succeeds.

☐ Database backup and restore test completed.

☐ Monitoring and alerts configured.

End of guide
