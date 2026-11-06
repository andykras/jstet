# TetColor production deployment — kraspeed

> **Status:** proposed implementation in Draft PR; no DNS, server, router or certificate changes have been made.
>
> **Target:** https://tetcolor.andykras.org
>
> **Ownership:** build and invoke deployment from the Mac; provision DNS, lighttpd and TLS on kraspeed with the local SSH agent.
>
> **Source of truth:** `andykras/jstet` master for releases; operational facts from `andykras/ops-notes` and deployed Mirra templates in `andykras/mirra-courses`.

## 1. Confirmed findings

| Area | Evidence / existing contract |
| --- | --- |
| Host | `kraspeed` is the home Arch Linux server, historically `192.168.1.199`; reach it from the home LAN or VPN via `ssh kraspeed` (Mac SSH alias uses port 1981). |
| Web | lighttpd already owns :80 and :443 and hosts existing sites. Reuse those listeners, **do not add a TCP port or a Node process** for TetColor. |
| Mirra | `mirra.oracle101.ru` serves static files from `/srv/mirra/dist`. Its host-scoped lighttpd config lives in `andykras/mirra-courses/deploy/lighttpd/95-mirra-courses.conf`. |
| SNI | Mirra adds a host-specific certificate to the existing shared :443 socket. Do not replace the socket's default certificate or disturb the WordPress and Mirra virtual hosts. |
| Certificate automation | `acme.sh` is installed; cron-based renewal was restored in `ops-notes/kraspeed/recon-2026-10-29.md`. That is dated evidence, **not a current health check**. |
| lighttpd operations | On this host **`systemctl reload lighttpd` is unsafe**: the Mirra runbook says SIGHUP can leave listeners down. Use `lighttpd -tt` first and, only for initial vhost/TLS installation, `sudo systemctl restart lighttpd`. |
| Packaging | JSTET is a **static Vite 7 PWA** with `base: './'`, relative manifest/icon URLs and a generated `service-worker.js`. No API, database, server-side runtime or persistent game state on kraspeed. |
| Dependency install | JSTET ignores `package-lock.json`. Therefore the Mac script uses `npm install`, **not `npm ci`**. Require a clean committed tree; run tests, lint and build before uploading. |

Read the actual sources:
- [kraspeed inventory](https://github.com/andykras/ops-notes/blob/main/kraspeed/recon-2026-10-29.md)
- [kraspeed LAN/SSH](https://github.com/andykras/ops-notes/blob/main/kraspeed/homelan.md)
- [Mirra lighttpd virtual host](https://github.com/andykras/mirra-courses/blob/main/deploy/lighttpd/95-mirra-courses.conf)
- [Mirra deployment script](https://github.com/andykras/mirra-courses/blob/main/scripts/deploy.sh)
- [Mirra rollback script](https://github.com/andykras/mirra-courses/blob/main/scripts/rollback.sh)
- [JSTET static PWA contract](../../vite.config.mjs)

### Facts that must be checked live

**Do not assume** the old WAN address, current DNS provider, port-forwarding, certificate challenge method, cron status, include order, ownership or server paths remain unchanged. In particular, the existing `andykras.org` certificate does not imply a certificate valid for `tetcolor.andykras.org`. The operator must inspect current SNI certificates and SAN entries.

## 2. Target architecture

```text
Mac (local checkout of andykras/jstet, approved SHA)
  npm install -> npm run test:unit -> npm run lint -> npm run build
  scripts/deploy-kraspeed.sh  -- SSH/rsync (dist only) -->
kraspeed:
  /srv/tetcolor/releases/<UTC-stamp>-<sha12>/dist
  /srv/tetcolor/current  -> latest release directory
  /srv/tetcolor/previous -> preceding release directory
  /srv/tetcolor/dist     -> /srv/tetcolor/current/dist
    lighttpd :80/443, vhost tetcolor.andykras.org, dedicated SNI TLS
      browser + PWA service worker
```

**Security/operational boundaries:** no public backend/Node port; do not copy the Git checkout, `.env`, `node_modules` or secrets to the web root; do not install/update Arch system packages; do not modify Mirra's API, PostgreSQL/SQLite, TLS, redirect or systemd service. All changes to existing lighttpd config must be backed up and reversible.

Atomic release symlink changes never require restarting lighttpd. The first vhost/certificate installation **does** require a tested lighttpd restart. The Mac script assumes the vhost and valid certificate have already been provisioned; it is intentionally not a certificate issuer.

## 3. Execution plan and acceptance gates

### P0 — Read-only inventory (Mac -> kraspeed)

Collect in **one** SSH session, save a redacted evidence file under the agent's local notes, and do **not** print key/token/private .env contents.

```sh
# Mac (VPN connected, no sudo changes):
ssh kraspeed 'hostname; id; uname -a; df -h /srv; systemctl is-active lighttpd cronie'
ssh kraspeed 'sudo -n lighttpd -tt -f /etc/lighttpd/lighttpd.conf'
ssh kraspeed 'sudo -n ss -lntp | grep -E ":(80|443) "'
ssh kraspeed 'readlink /srv/mirra/dist || true; test -e /srv/tetcolor && ls -ld /srv/tetcolor || true'
ssh kraspeed 'command -v acme.sh || test -x "$HOME/.acme.sh/acme.sh"; systemctl list-timers --all | grep -Ei "acme|cert|renew" || true'
dig +short tetcolor.andykras.org A
dig +short mirra.oracle101.ru A
```

Inspect lighttpd's **effective** include chain, the Mirra HTTPS/ACME challenge method and renewal hook, and the *current* public IP/NAT. Verify `/srv/tetcolor` does not already contain unrelated content. If any needed command or permission is missing, **stop and report** instead of guessing. Arch is old; no `pacman -Syu`, certbot installation or service-wide replacements.

**Gate P0:** operator knows exact DNS target, document-root permissions, lighttpd include order, ACME method and certificate renewal behavior.

### P1 — DNS, HTTPS and lighttpd

1. Make a dedicated `A tetcolor` entry under `andykras.org` pointing to the **verified current** public WAN address, or implement the authoritative DNS-provider equivalent. Check propagation independently; do not blindly copy an October IP. If Cloudflare is involved, confirm whether this host should be DNS-only or proxied, and explicitly verify its HTTPS mode and the HTTP-01 challenge path.
2. Verify external :80/:443 routes already reach kraspeed. No new port-forward rule unless the live topology proves one is required.
3. Use **the existing `acme.sh` account and existing HTTP-01/DNS challenge pattern**. Do not use standalone mode while lighttpd owns :80. Ensure `/.well-known/acme-challenge/` remains reachable without HTTPS redirect or SPA rewrite. Prefer a **persistent ACME webroot outside versioned `dist/`** if using HTTP-01; do not write challenges into an immutable release.
4. Issue/renew the exact hostname certificate. Install its full chain/key in a **dedicated** readable-but-protected path selected during P0; confirm SNI and certificate renewal/restart hook. Avoid copying private keys to the Git repository.
5. Adapt [the vhost review template](../../deploy/lighttpd/96-tetcolor.conf.example) to the *live* include structure; add **one** new host-scoped config only. Follow Mirra's include-after-order so that existing WordPress rewrites do not capture this host. Avoid PHP/fastcgi, API proxy and SPA catch-all unless actually needed.
6. Backup config; run `sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf`; apply with `sudo systemctl restart lighttpd` (**never reload**), and immediately verify Mirra, WordPress and the new SNI route. Roll back the config and restart if another host regresses.

**Gate P1:** HTTPS certificate valid for `tetcolor.andykras.org`, correct HTTP→HTTPS redirect, ACME challenge and renewal confirmed, Mirra/WordPress unaffected.

### P2 — First static deployment from the Mac

Use the new [Mac deploy script](../../scripts/deploy-kraspeed.sh). By default it requires a clean `master` checkout; if a pre-merge release from this PR is explicitly authorized, set `ALLOW_DEPLOY_NON_MASTER=1` for that deliberate run. The script runs all three QA commands and uploads **only** `dist/`. The remote side stages an immutable release, records its commit SHA and switches `current` atomically. The server **does not build or install packages**.

```sh
# Mac, after P1 and after explicitly authorizing the live deployment
cd /path/to/jstet
git switch master && git pull --ff-only
bash scripts/deploy-kraspeed.sh
```

Initial provisioning should create `/srv/tetcolor/releases` and a stable `/srv/tetcolor/dist` symlink. Validate that no unrelated directory is being replaced before creating or swapping links.

**Gate P2:** returned commit SHA matches `current/.release`, public HTTPS serves the expected HTML/manifest/SW/assets without 404s, and the shell remains running without any Node service.

### P3 — Production QA and rollback

- Check `https://tetcolor.andykras.org/`: title, TLS chain/SAN, HTTP→HTTPS, six classic TetColor colors, Classic mode, mobile touch, dialog controls, clean console.
- Confirm `/manifest.json`, `/service-worker.js`, icon URLs and Vite hashed assets load correctly at the domain root; no hidden `/jstet/` path dependency.
- Verify SW control and offline reload **after the online page and assets are cached**. Check cache headers: `index.html`, manifest and SW must revalidate; hashed assets may be cached long-term.
- Validate that `mirra.oracle101.ru` and `oracle101.ru` still respond normally and certificate renewal has not been disabled.
- Exercise an actual upgrade to a second valid release and [rollback script](../../scripts/rollback-kraspeed.sh); verify marker, content and symlink targets. Do not garbage-collect the previous version until rollback is proven.
- Record exact SHA, UTC deployment time, DNS, certificate expiration (not private key), effective vhost config path, scripts used, screenshots, checks and rollback status.

**Gate P3:** public site works end-to-end, offline PWA works, the previous release can be restored and all existing sites remain healthy.

## 4. Source ownership / PR boundaries

This JSTET PR contains only:
- this deployment runbook and agent task;
- a **review-only** lighttpd SNI template (must be adapted from P0 output);
- the Mac deploy and rollback scripts (do not execute them until P1);
- static contracts/tests and a short README link.

The *server's actual effective config, ACME installation/renewal and DNS record* will be applied by the local agent and recorded in `andykras/ops-notes` as a separate operational note or PR. Keep the JS game engine, UI, scoring, PWA routing and runtime dependencies unchanged. **Never add GitHub Actions.**

## 5. Agent handoff

Read [kraspeed agent task](./tetcolor-kraspeed-agent-handoff.md). Execute P0 first and preserve its evidence. Continue with P1/P2/P3 only once preflight assumptions have been verified and the live changes have been explicitly authorized. The objective is the working public site, not merely a successful lighttpd syntax check.
