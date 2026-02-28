---
description: How to deploy Tablia to dev.tablia.io via CI/CD or manually
---

## Automated Deploy (CI/CD)

Every push to `main` that touches `apps/tablia/**` triggers the GitHub Actions workflow automatically.

**Workflow file:** `.github/workflows/deploy-tablia.yml`

The pipeline:

1. Installs dependencies (`yarn install --frozen-lockfile`)
2. Builds the Vite app with production env vars
3. Deploys via `rsync` over SSH to the VPS

---

## Required GitHub Secrets

Set these in `github.com/users/juanobrach/entity-builders/settings/secrets/actions`:

| Secret                     | Value                                         |
| -------------------------- | --------------------------------------------- | ------ | ------- |
| `TABLIA_SUPABASE_URL`      | URL del Supabase Cloud Project de Tablia      |
| `TABLIA_SUPABASE_ANON_KEY` | Anon key del Supabase Cloud Project           |
| `TABLIA_GEMINI_API_KEY`    | Gemini API key para producción                |
| `HOSTINGER_SSH_HOST`       | IP del VPS (ej. `123.45.67.89`)               |
| `HOSTINGER_SSH_USER`       | Usuario SSH del VPS (ej. `root` o `ubuntu`)   |
| `HOSTINGER_SSH_KEY`        | Private key **en base64**: `cat ~/.ssh/id_rsa | base64 | pbcopy` |
| `HOSTINGER_DEPLOY_PATH`    | Path en el server (ej. `/var/www/dev-tablia`) |

---

## Manual Deploy (sin CI)

```bash
# 1. Build locally
yarn build:tablia

# 2. Sync dist/ al VPS
rsync -avz --delete \
  apps/tablia/dist/ \
  user@server-ip:/var/www/dev-tablia/
```

---

## One-time Server Setup

Esto se hace UNA sola vez en el VPS:

// turbo

1. Crear el directorio de deploy:

```bash
ssh user@server-ip "sudo mkdir -p /var/www/dev-tablia && sudo chown $USER:$USER /var/www/dev-tablia"
```

2. Instalar Nginx si no está instalado:

```bash
ssh user@server-ip "sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx"
```

3. Copiar y activar la config de Nginx:

```bash
scp apps/tablia/.agents/nginx-dev.conf user@server-ip:/etc/nginx/sites-available/dev.tablia.io
ssh user@server-ip "sudo ln -s /etc/nginx/sites-available/dev.tablia.io /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx"
```

4. Obtener certificado SSL:

```bash
ssh user@server-ip "sudo certbot --nginx -d dev.tablia.io"
```

---

## Supabase Cloud Setup (one-time)

```bash
cd apps/tablia

# Link al proyecto cloud
supabase link --project-ref <YOUR_PROJECT_REF>

# Push todas las migraciones
supabase db push
```

Las migraciones están en `apps/tablia/supabase/migrations/`.
