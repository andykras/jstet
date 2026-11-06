#!/usr/bin/env bash
set -euo pipefail

# Mac-only: publish a previously provisioned static lighttpd site on kraspeed.
# The remote host never runs npm, Vite, a Node server, or GitHub Actions.
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
SERVER="${DEPLOY_SERVER:-kraspeed}"
HOST="tetcolor.andykras.org"
LOCK_DIR="${TMPDIR:-/tmp}/tetcolor-deploy.lock"
UPLOAD=""

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [ -n "$UPLOAD" ]; then
    # UPLOAD is validated against a fixed mktemp prefix before any use.
    ssh "$SERVER" "rm -rf -- '$UPLOAD'" >/dev/null 2>&1 || true
  fi
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
  exit "$status"
}

mkdir "$LOCK_DIR" 2>/dev/null || fail "Another TetColor deploy/rollback is running (or stale lock: $LOCK_DIR)"
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$ROOT"
[ -z "$(git status --porcelain)" ] || fail "Working tree is not clean; commit or stash changes first"
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "master" ] && [ "${ALLOW_DEPLOY_NON_MASTER:-0}" != "1" ]; then
  fail "Production deploy requires master; set ALLOW_DEPLOY_NON_MASTER=1 only after explicit authorization"
fi
SHA="$(git rev-parse HEAD)"
case "$SHA" in
  *[!0-9a-f]*|"") fail "Invalid Git commit SHA: $SHA" ;;
esac

printf '==> Building JSTET on Mac: %s (%s)\n' "$SHA" "$BRANCH"
npm install --no-audit --no-fund
npm run test:unit
npm run lint
npm run build

for file in index.html manifest.json service-worker.js \
  img/icons/android-chrome-192x192.png img/icons/android-chrome-512x512.png; do
  [ -s "dist/$file" ] || fail "Missing required build output: dist/$file"
done
grep -Fq 'JSTET — Arcade 2077' dist/index.html || fail "Unexpected built HTML title"

printf '==> Opening temporary kraspeed upload directory\n'
UPLOAD="$(ssh "$SERVER" 'mktemp -d /tmp/tetcolor-upload.XXXXXXXX')"
[[ "$UPLOAD" =~ ^/tmp/tetcolor-upload\.[A-Za-z0-9]+$ ]] || fail "Unexpected remote temp path: $UPLOAD"
ssh "$SERVER" "mkdir -p -- '$UPLOAD/dist'"
printf '==> Uploading only dist/ to %s\n' "$SERVER"
rsync -az --delete -- "$ROOT/dist/" "$SERVER:$UPLOAD/dist/"

printf '==> Publishing atomically on kraspeed\n'
ssh "$SERVER" bash -s -- "$SHA" "$UPLOAD" <<'REMOTE'
set -euo pipefail
SHA="$1"
UPLOAD="$2"
HOST="tetcolor.andykras.org"
BASE="/srv/tetcolor"
RELEASES="$BASE/releases"
CURRENT="$BASE/current"
PREVIOUS="$BASE/previous"
DIST="$BASE/dist"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$UPLOAD" =~ ^/tmp/tetcolor-upload\.[A-Za-z0-9]+$ ]] || die "Unsafe upload path"
[ -s "$UPLOAD/dist/index.html" ] || die "Upload has no index.html"
[ -s "$UPLOAD/dist/service-worker.js" ] || die "Upload has no service worker"
sudo -n true || die "Requires existing passwordless sudo access"
sudo -n systemctl is-active --quiet lighttpd || die "lighttpd is not active"
sudo -n lighttpd -tt -f /etc/lighttpd/lighttpd.conf >/dev/null ||
  die "lighttpd config invalid: provision HTTPS first"
exec 9>/tmp/tetcolor-release.lock
flock -n 9 || die "Another TetColor release/rollback is in progress"

[ ! -e "$CURRENT" ] || [ -L "$CURRENT" ] || die "$CURRENT is not a symlink"
[ ! -e "$PREVIOUS" ] || [ -L "$PREVIOUS" ] || die "$PREVIOUS is not a symlink"
[ ! -e "$DIST" ] || [ -L "$DIST" ] || die "$DIST exists but is not a symlink"
if [ -L "$DIST" ]; then
  [ "$(readlink "$DIST")" = "$CURRENT/dist" ] ||
    die "$DIST points to an unexpected target"
fi

OLD=""
if [ -L "$CURRENT" ]; then
  OLD="$(readlink "$CURRENT")"
  case "$OLD" in "$RELEASES"/*) ;; *) die "Unexpected current release: $OLD" ;; esac
  [ -f "$OLD/.release" ] || die "Current release marker missing"
fi

STAMP="$(date -u +%Y%m%d-%H%M%S)"
RELEASE="$RELEASES/$STAMP-${SHA:0:12}"
STAGE="$RELEASES/.stage-$STAMP-$$"
sudo -n mkdir -p -- "$RELEASES"
[ ! -e "$RELEASE" ] || die "Release already exists: $RELEASE"
sudo -n mkdir -p -- "$STAGE/dist"
sudo -n rsync -a -- "$UPLOAD/dist/" "$STAGE/dist/"
printf '%s\n' "$SHA" | sudo -n tee "$STAGE/.release" >/dev/null
sudo -n chown -R kras:http "$STAGE"
sudo -n chmod -R a+rX "$STAGE"
sudo -n mv -- "$STAGE" "$RELEASE"

SWITCHED=0
MADE_DIST_LINK=0
rollback_on_error() {
  local rc=$?
  trap - EXIT
  if [ "$rc" -ne 0 ] && [ "$SWITCHED" -eq 1 ]; then
    printf 'ERROR: publish failed; restoring previous current symlink\n' >&2
    if [ -n "$OLD" ]; then
      sudo -n ln -s "$OLD" "$CURRENT.revert.$$" &&
        sudo -n mv -Tf "$CURRENT.revert.$$" "$CURRENT" || true
    else
      sudo -n rm -f -- "$CURRENT" || true
    fi
    if [ "$MADE_DIST_LINK" -eq 1 ]; then
      sudo -n rm -f -- "$DIST" || true
    fi
  fi
  exit "$rc"
}
trap rollback_on_error EXIT

if [ ! -L "$DIST" ]; then
  sudo -n ln -s "$CURRENT/dist" "$DIST"
  MADE_DIST_LINK=1
fi
sudo -n ln -s "$RELEASE" "$CURRENT.next.$$"
sudo -n mv -Tf "$CURRENT.next.$$" "$CURRENT"
SWITCHED=1

# Direct loopback SNI probe verifies lighttpd vhost routing and the real TLS
# chain without relying on public DNS propagation or insecure -k.
HTML="$(curl --noproxy '*' -fsS --max-time 15 \
  --resolve "$HOST:443:127.0.0.1" "https://$HOST/")" ||
  die "TLS homepage probe failed after switch"
printf '%s' "$HTML" | grep -Fq 'JSTET — Arcade 2077' ||
  die "Unexpected HTTPS homepage after switch"
for path in /manifest.json /service-worker.js \
  /img/icons/android-chrome-192x192.png /img/icons/android-chrome-512x512.png; do
  curl --noproxy '*' -fsS --max-time 15 \
    --resolve "$HOST:443:127.0.0.1" -o /dev/null "https://$HOST$path" ||
    die "HTTPS asset probe failed: $path"
done

# Do not replace the rollback pointer until the new release is healthy.
if [ -n "$OLD" ]; then
  sudo -n ln -s "$OLD" "$PREVIOUS.next.$$"
  sudo -n mv -Tf "$PREVIOUS.next.$$" "$PREVIOUS"
fi
SWITCHED=0
printf '==> Deployed %s\n' "$SHA"
printf '    current: %s\n' "$RELEASE"
printf '    previous: %s\n' "${OLD:-<first release>}"
REMOTE

printf '==> Checking public HTTPS from Mac (not a cached local vhost response)\n'
curl --noproxy '*' -fsS --max-time 20 -o /dev/null "https://$HOST/" ||
  fail "Remote publish succeeded, but external HTTPS failed; investigate DNS/NAT and use rollback if needed"
printf '==> Deployment finished: %s at https://%s\n' "$SHA" "$HOST"
