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

The Worker exposes `POST /api/v1/players` (nickname), `POST /api/v1/scores` (Bearer token) and `GET /api/v1/leaderboard?mode=tetcolor|classic&period=week|all` (optional Bearer token for personal rank).

## Integrity, consent and limitations

- The player explicitly chooses a nickname and agrees to publish this and later eligible completed games. Until then no scores are sent to the service.
- Identifiers and opaque 256-bit bearer tokens are stored in the browser's localStorage; only their SHA-256 hashes are kept in D1. Clearing browser data loses this pseudonymous profile. Only nickname, run metadata and results are public, not emails or raw IP addresses.
- Only normal one-at-a-time clearing (`singleBlock: true`) qualifies. Results carry a ruleset version. The API checks fields and bounds, one submission per run, 10-second score spacing and up to 5 registrations per hashed IP per hour.
- This is **not cheat-proof**. Because the browser determines scores and rules, modified clients can still post fabricated values. Competitive verification requires server replay with a controlled seed and action trace, implemented separately. The public leaderboard must not be described as verified or anti-cheat secured.
- Plan retention and manual moderation/deletion for abusive names and scores before public launch. Rotate the signup-rate salt with care: old per-IP fingerprints cannot be correlated with new ones.
