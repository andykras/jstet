# JSTET leaderboard API

A separate Cloudflare Worker and D1 database for the optional public JSTET leaderboard. Nothing in the game requires this service to play. Rankings contain the highest score per anonymous player for each mode and period; the weekly period starts Monday 00:00 UTC.

## Development

1. From `leaderboard-api/`, run `npm install`.
2. Set `RATE_LIMIT_SALT` to a random 32+ character secret in a local ignored `.dev.vars` file, e.g. `RATE_LIMIT_SALT=replace-with-cryptographically-random-value`. Never commit real secrets.
3. Run `npm run migrate:local`, then `npm run dev`.
4. Start the main Vite app with `VITE_LEADERBOARD_API_URL=http://localhost:8787 npm run dev` (from the repository root). The development origin must be in `ALLOWED_ORIGINS`.

## Production setup (manual, separately authorized)

1. Create a dedicated D1 database, e.g. `npx wrangler d1 create jstet-leaderboard`. Replace the **all-zero placeholder** `database_id` in `wrangler.jsonc` with the real ID; never reuse another application's D1 database.
2. Add the secret with `npx wrangler secret put RATE_LIMIT_SALT` (do not put it in `wrangler.jsonc` or Git).
3. Review the allowed origins, rate-limiting/WAF policy, privacy and abuse response procedures. Apply the migration using `npm run migrate:remote`, then deploy using `npm run deploy`.
4. Build the PWA with `VITE_LEADERBOARD_API_URL=https://<your-worker-hostname> npm run build`. The URL is baked into the static build. Test CORS, anonymous signup, posting, retrieval, weekly boundaries and offline/error behavior before any production release.
5. Publish only after authorizing the standalone API and the existing kraspeed static-release procedure. Do not change lighttpd or other kraspeed services for this feature.

The Worker exposes `GET /api/v1/health` (checks the database and schema), `POST /api/v1/players` (nickname), `POST /api/v1/scores` (Bearer token) and `GET /api/v1/leaderboard?mode=tetcolor|classic&period=week|all` (optional Bearer token for personal rank).

## Integrity, consent and limitations

- The player explicitly chooses a nickname and agrees to publish this and later eligible completed games. Until then no scores are sent to the service. Automatic publication can be disabled locally; the player can still publish individual completed runs manually.
- Identifiers and opaque 256-bit bearer tokens are stored in the browser's localStorage; only their SHA-256 hashes are kept in D1. Clearing browser data or using 'Forget this profile' removes access to the pseudonymous profile on that device but **does not delete published scores**. Only nickname, run metadata and results are public, not emails or raw IP addresses.
- Only normal one-at-a-time clearing (`singleBlock: true`) qualifies. Results carry a ruleset version. The API checks fields and bounds, one submission per run, 10-second score spacing and up to 5 registrations per hashed IP per hour.
- This is **not cheat-proof**. Because the browser determines scores and rules, modified clients can still post fabricated values. Competitive verification requires server replay with a controlled seed and action trace, implemented separately. The public leaderboard must not be described as verified or anti-cheat secured.
- Plan retention and manual moderation/deletion for abusive names and scores before public launch. Rotate the signup-rate salt with care: old per-IP fingerprints cannot be correlated with new ones.

## Visual-review deployment

The main application's Mac deployment script supports an explicit **feature-branch-only**
`VISUAL_PREVIEW_SKIP_QA=1` flag alongside `ALLOW_DEPLOY_NON_MASTER=1`.
This skips unit tests and ESLint for a requested visual-review release while
still running `npm install`, `npm run build`, artifact validation, HTTPS
health probes and atomic release/rollback protection. It is disabled by default
and not permitted on `master`.

If the Worker or D1 is not provisioned, deploy the frontend for visual review
with the API URL unset. You can explicitly set `VITE_LEADERBOARD_PREVIEW=1`
during a non-master preview build. Sample standings are then accessible only
at `?leaderboardPreview=1`, conspicuously labeled as simulated and incapable
of submitting scores. Every other URL shows the disconnected state and
local personal records. Never present sample scores as live rankings.

For abuse cleanup, a Cloudflare D1 operator may inspect player IDs and remove
unwanted results directly with Wrangler D1 commands, preserving an operational
record. Do not publish an unauthenticated administrative deletion endpoint.
