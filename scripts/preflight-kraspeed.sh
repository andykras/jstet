#!/usr/bin/env bash
set -euo pipefail

# Read-only inventory. Does not print private keys, tokens or .env content.
SERVER="${DEPLOY_SERVER:-kraspeed}"
printf '==> Mac DNS (current results, not an assumed old WAN address)\n'
if command -v dig >/dev/null 2>&1; then
  dig +short tetcolor.andykras.org A || true
  dig +short mirra.oracle101.ru A || true
else
  printf 'dig is unavailable on this Mac\n'
fi

printf '==> kraspeed read-only inventory\n'
ssh "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
printf '\n-- Identity / uptime / disk --\n'
hostname
id
uname -a
df -h /srv
printf '\n-- Web / cron status --\n'
systemctl is-active lighttpd || true
systemctl is-enabled lighttpd || true
systemctl is-active cronie || true
printf '\n-- Existing lighttpd syntax --\n'
sudo -n lighttpd -tt -f /etc/lighttpd/lighttpd.conf || true
printf '\n-- TCP 80/443 listeners --\n'
sudo -n ss -lntp | grep -E ':(80|443)\b' || true
printf '\n-- Existing site links (do not modify) --\n'
ls -ld /srv/mirra/dist /srv/mirra/current 2>/dev/null || true
ls -ld /srv/tetcolor /srv/tetcolor/dist /srv/tetcolor/current 2>/dev/null || true
printf '\n-- ACME executable and installed domain list, no secrets --\n'
if [ -x "$HOME/.acme.sh/acme.sh" ]; then
  "$HOME/.acme.sh/acme.sh" --list || true
elif command -v acme.sh >/dev/null 2>&1; then
  acme.sh --list || true
else
  printf 'acme.sh not found in standard locations; locate manually\n'
fi
printf '\n-- Relevant cron timer metadata (no private configuration contents) --\n'
systemctl list-timers --all | grep -Ei 'acme|cert|renew' || true
printf '\n-- End read-only collection --\n'
REMOTE

printf '==> Next: inspect effective lighttpd includes / ACME webroot / public WAN and DNS provider manually; do not assume them.\n'
