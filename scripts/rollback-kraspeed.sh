#!/usr/bin/env bash
set -euo pipefail

# Mac-only: swap the two most recently published immutable releases.
SERVER="${DEPLOY_SERVER:-kraspeed}"
HOST="tetcolor.andykras.org"
LOCK_DIR="${TMPDIR:-/tmp}/tetcolor-deploy.lock"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

mkdir "$LOCK_DIR" 2>/dev/null || fail "Another TetColor deploy/rollback is running (or stale lock: $LOCK_DIR)"
trap 'rmdir "$LOCK_DIR" >/dev/null 2>&1 || true' EXIT

ssh "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
HOST="tetcolor.andykras.org"
RELEASES="/srv/tetcolor/releases"
CURRENT="/srv/tetcolor/current"
PREVIOUS="/srv/tetcolor/previous"
DIST="/srv/tetcolor/dist"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
sudo -n true || die "Requires existing passwordless sudo"
exec 9>/tmp/tetcolor-release.lock
flock -n 9 || die "Another TetColor release/rollback is in progress"

[ -L "$CURRENT" ] && [ -L "$PREVIOUS" ] || die "No current/previous release pair to roll back"
[ -L "$DIST" ] || die "Missing site dist symlink"
[ "$(readlink "$DIST")" = "$CURRENT/dist" ] || die "Unexpected dist symlink"

OLD="$(readlink "$CURRENT")"
TARGET="$(readlink "$PREVIOUS")"
case "$OLD" in "$RELEASES"/*) ;; *) die "Unexpected current target" ;; esac
case "$TARGET" in "$RELEASES"/*) ;; *) die "Unexpected previous target" ;; esac
[ "$OLD" != "$TARGET" ] || die "Current and previous point at the same release"
[ -s "$OLD/.release" ] && [ -s "$TARGET/.release" ] ||
  die "Release SHA marker missing; refusing rollback"
[ -s "$TARGET/dist/index.html" ] || die "Previous release has no HTML"

restore() {
  local rc=$?
  trap - EXIT
  if [ "$rc" -ne 0 ]; then
    printf 'ERROR: rollback health check failed, attempting to restore original current release\n' >&2
    sudo -n ln -s "$OLD" "$CURRENT.revert.$$" &&
      sudo -n mv -Tf "$CURRENT.revert.$$" "$CURRENT" || true
  fi
  exit "$rc"
}

sudo -n ln -s "$TARGET" "$CURRENT.next.$$"
sudo -n mv -Tf "$CURRENT.next.$$" "$CURRENT"
trap restore EXIT
HTML="$(curl --noproxy '*' -fsS --max-time 15 \
  --resolve "$HOST:443:127.0.0.1" "https://$HOST/")" ||
  die "Rollback HTTPS health probe failed"
printf '%s' "$HTML" | grep -Fq 'JSTET — Arcade 2077' ||
  die "Unexpected homepage after rollback"

sudo -n ln -s "$OLD" "$PREVIOUS.next.$$"
sudo -n mv -Tf "$PREVIOUS.next.$$" "$PREVIOUS"
trap - EXIT
printf '==> Rollback finished\n'
printf '    current: %s (%s)\n' "$TARGET" "$(cat "$TARGET/.release")"
printf '    previous: %s (%s)\n' "$OLD" "$(cat "$OLD/.release")"
REMOTE

printf '==> Checking external HTTPS after rollback\n'
curl --noproxy '*' -fsS --max-time 20 -o /dev/null "https://$HOST/" ||
  fail "Rollback succeeded on kraspeed but external HTTPS failed; investigate DNS/NAT"
printf '==> Site reachable at https://%s\n' "$HOST"
