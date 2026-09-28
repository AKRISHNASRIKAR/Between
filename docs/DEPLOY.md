# Deploying Love Notes

Target for the private beta: **$0/month infrastructure**. Only the app-store fees cost money.

| Piece | Service | Free tier |
|---|---|---|
| API (Bun + Hono) | Docker on an Oracle Cloud *Always Free* ARM VM, HTTPS via Caddy | 4 cores / 24 GB, always on |
| Database | Neon Postgres | 0.5 GB |
| Photos | Cloudflare R2 (private bucket, S3 API) | 10 GB, free bandwidth |
| Sign-in email | Resend | 3,000 / month |
| Push | Expo Push Service | free |
| iOS builds | EAS Build free tier, or local Xcode | — |

Any $5/month VPS works the same way if Oracle sign-up is a hassle.

## 1. Accounts (you)
1. **Neon** → new project → copy the pooled connection string.
2. **Cloudflare** → R2 → create bucket `lovenotes-media` (private) → *Manage API tokens* → Object Read & Write for that bucket → copy access key, secret, and the account's S3 endpoint.
3. **Resend** → verify a sending domain (or use their test domain for the beta) → API key.
4. **Oracle Cloud** → Always Free → create an Ubuntu ARM (Ampere) VM → open ports 80/443 in the security list.
5. A **domain** (optional but recommended, ~$10/yr) → `A` record `api.yourdomain.com` → the VM's IP.
6. **Apple Developer Program** ($99/yr) → needed for TestFlight and real push.

## 2. Server (one-time)
```bash
# on the VM
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
git clone <your repo> lovenotes && cd lovenotes/deploy
cp .env.production.example .env.production   # fill it in
API_DOMAIN=api.yourdomain.com docker compose up -d --build
curl https://api.yourdomain.com/health        # {"ok":true}
```
Migrations run automatically on every start; quiz content syncs from `content/quizzes`.

## 3. App
1. `bunx eas-cli login && bunx eas-cli init` in `apps/mobile` (links an EAS project → push tokens start working).
2. Set `EXPO_PUBLIC_API_URL=https://api.yourdomain.com` for production builds (EAS env or `eas.json`).
3. `bunx eas-cli build -p ios --profile production` → `bunx eas-cli submit -p ios` → TestFlight.
4. Upload an APNs key to EAS (`eas credentials`) so Expo Push can reach iPhones.

## 4. Before the App Store
- Privacy policy URL + App Store privacy labels (email, photos, user content; no tracking).
- In-app account deletion ✓ (Settings → Delete my account).
- Sign in with Apple is **not** required while sign-in is email-only; it becomes required if Google sign-in is added.
- Run the five pre-launch audits (design, layout, states, security/privacy, performance).

## Operations
- **Backups:** Neon point-in-time restore (free tier: 24 h history). Export regularly for the beta.
- **Cleanup:** the API purges closed spaces after 30 days and abandoned uploads hourly.
- **Scaling past one server:** move realtime to Postgres LISTEN/NOTIFY or Cloudflare Durable Objects (see SPEC §11); the `realtime/hub.ts` adapter is the only file that changes.
