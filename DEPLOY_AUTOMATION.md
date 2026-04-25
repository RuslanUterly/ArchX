# Auto Deploy (GitHub Actions -> VPS)

## 1) GitHub Secrets

Add repository secrets:

- `VPS_HOST` - server IP or domain
- `VPS_USER` - SSH user
- `VPS_SSH_KEY` - private SSH key content (PEM/OpenSSH)
- `VPS_PORT` - optional, default is `22`
- `VPS_APP_PATH` - absolute path to project on server (example: `/opt/archx`)

## 2) One-time server setup

1. Install Docker + Docker Compose plugin.
2. Clone this repository to `VPS_APP_PATH`.
3. Create `.env` in project root (based on `.env.example`).
4. Ensure DNS points to your server and ports `80/443` are open.

## 3) Deploy flow

- Push to `main` (or `master`).
- Workflow `.github/workflows/deploy.yml` connects over SSH and runs:
  - `git fetch`
  - `git checkout <branch>`
  - `git pull origin <branch>`
  - `docker compose up -d --build`

## 4) Manual run

You can also run deployment manually from the GitHub Actions tab via `workflow_dispatch`.
