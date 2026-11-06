# Agent task: publish JSTET at tetcolor.andykras.org

> **This file is the execution brief for a local Mac/Opencode agent.**
> Project: `andykras/jstet` · branch: `feat/tetcolor-kraspeed-deploy` · Draft PR.
> Infrastructure notes: `andykras/ops-notes`, `kraspeed/README.md`, `kraspeed/homelan.md`, `kraspeed/recon-2026-10-29.md`.
> Working analogue: `andykras/mirra-courses/scripts/deploy.sh` and `deploy/lighttpd/95-mirra-courses.conf`.
> Full procedure: [deployment runbook](./tetcolor-kraspeed-deployment.md).

## Contract

- Target **https://tetcolor.andykras.org** on the **existing kraspeed lighttpd :80/:443**, with its own valid auto-renewed SNI TLS certificate.
- Site is **static**. **Build and QA on Mac**, rsync `dist/` only; no backend, Node service, additional port or data migration on kraspeed.
- Do not change the Mirra, WordPress, Postfix, Bitok or other service configuration except for a carefully reviewed additive lighttpd include/SNI entry.
- Do not update Arch, install packages, rotate existing certs, overwrite keys, flush firewall rules, change router settings gratuitously, force-push, merge the Draft PR, or use GitHub Actions.
- `lighttpd reload` is known unsafe on this host: use configuration test and **restart** only in the explicitly planned configuration step.
- No secrets or private keys in terminal output, git commits, test logs or reports.

## Phase A: collect first (read-only)

1. Sync the working tree without losing uncommitted work. Confirm `master` and the deployment branch, latest SHA, clean status, Node/npm versions.
2. From Mac (VPN), use **one comprehensive SSH collect** to verify: host identity, public WAN/NAT, DNS authority, :80/:443 and lighttpd include order, current cert list and SNI paths, acme.sh challenge/cron/install/reload implementation, active Mirra/WordPress routes, disk, permissions and whether `/srv/tetcolor` already exists.
3. Report **exact verified facts and blockers** before any destructive or public change. Never paste private keys/tokens. If lighttpd routing or ACME mechanism differs from the Mirra template, update this plan/template before installing anything.

## Phase B: provision and verify

4. Set the DNS record using the actual authoritative provider and **verified** current WAN address. Validate reachability and any Cloudflare proxy settings.
5. Configure HTTP-01 or DNS validation **following the established acme.sh mechanism** and ensure renewal/HTTP-01 challenge stays outside versioned site assets. Issue/install the exact hostname certificate; verify permissions and renewal hook.
6. Add a dedicated lighttpd vhost based on `deploy/lighttpd/96-tetcolor.conf.example` and **verified** include order. Preserve existing socket and WordPress/Mirra configs. Back up effective configuration; run `lighttpd -tt`, then `systemctl restart lighttpd` (never reload).
7. Test exact certificate name, HTTPS + HTTP redirect, valid SNI, ACME challenge path, and unaffected Mirra/WordPress sites. On failure, restore config and cert links from backup and restart.

## Phase C: deploy from Mac

8. Confirm authorization to publish from the selected Git SHA. Prefer approved `master`; only set `ALLOW_DEPLOY_NON_MASTER=1` for explicitly approved branch builds.
9. Run `bash scripts/deploy-kraspeed.sh` from the **Mac**, not on kraspeed; it tests/builds locally, uploads only `dist/`, stages versioned files and changes `current` atomically. Watch all exit codes. No npm install or Vite build on the server.
10. Validate `current/.release` and `previous` symlinks, `index.html`, manifest/icons/SW, public DNS/TLS/HTTP, browser UI and mobile touch. Test browser SW online registration and offline reload. Test no unexpected fallback to another vhost.
11. Once a second release exists, exercise `bash scripts/rollback-kraspeed.sh` from the Mac and verify it returns to the previous SHA; if necessary republish the intended latest release. Confirm both existing Mirra and WordPress still work.
12. Record output in a dated `ops-notes` file (sanitized, no secrets) and the PR/handover. Do not mark gates passed without actual logs/screenshots. Leave the PR open for review until the user approves merge.

## Acceptance report format

- Host/DNS: current public address, provider, record type, TTL/propagation, router reachability.
- TLS: cert SAN and expiration, ACME mode + renewed-file install path + confirmed renewal hook.
- Web: include path, `lighttpd -tt` / restart, HTTP→HTTPS, status/cert of TetColor/Mirra/WordPress.
- Source and deploy: local SHA, Node/npm, all QA exit codes, remote release and SHA marker.
- PWA/UI: title, manifest/icons/SW status, actual gameplay/mobile checks, console, offline reload.
- Rollback: previous/current SHAs and real observed behavior, not hypothetical.
- Remaining blockers, exact commands run and whether the public deployment is live.

**Do not claim success from a template or the GitHub diff alone.**
