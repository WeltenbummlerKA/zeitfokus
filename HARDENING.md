# Hardened Traggo candidate

This fork combines upstream master `8ca9bb6aa414ae621488a5a158a6235e89cfa57b` with the frontend migration from PR #244, head `3a85a94f84868f233b2ba7af27bb7f8a4b432426`. The calendar merge retains the newer upstream timezone serialization fix. Frontend dependency updates beyond that PR are intentional; the original PR's July audit numbers are not a current security baseline.

## Security behavior

- Changing a user's password revokes all their device tokens in the same database transaction. The current session must log in again.
- Expiring tokens are checked before authentication and activity renewal. `NoExpiry` remains an explicitly supported device type.
- New device tokens are stored as SHA-256 verifiers. Existing random tokens migrate on successful authentication. Stored verifiers cannot themselves be used as bearer credentials. No schema migration or client token replacement is required.
- Cookies use HttpOnly, SameSite=Lax and Path=/ consistently, including renewal and deletion. HTTPS automatically enables Secure. Set `TRAGGO_COOKIE_SECURE=true` behind an HTTPS reverse proxy. Deliberate HTTP intranet use remains supported with the default false setting. Forwarded headers are not trusted to determine cookie security.
- Raw GraphQL documents, variables, error text, SQL statements/parameters and full configuration are excluded from application diagnostic logs.
- Dashboard entry ranges must belong to the same authorized dashboard. Existing time entries remain scoped to their user.
- GraphQL accepts JSON POST and GET queries; unused multipart and WebSocket transports are rejected. Browser Origins must match the request Host, and cross-site fetches are rejected. Preserve the original Host header at a reverse proxy. Native clients without Origin remain supported.
- Request bodies are limited to 1 MiB before authentication or parsing. There is a limit of 120 GraphQL requests per socket peer per minute, plus 10 login attempts per username per 15 minutes. Login aliases count individually. The bounded limiter state is process-local; reverse proxies share one peer quota, and restarts reset counters. Production proxy limits remain useful.
- Query complexity is capped at 200; paged time spans have a positive page size; interval expansion is limited to five years, with at most 50,000 supplied statistics ranges. HTTP servers use finite header/read/write/idle timeouts.
- Empty databases require an explicitly configured bootstrap password with at least 12 characters. Existing database passwords are not changed on startup.
- Gorilla WebSocket and the embedded SQLite driver were updated; database enum scanners accept both string and byte representations returned by the supported drivers.

## Candidate image

`Dockerfile.hardened` builds the frontend and backend from this source. The Hardened candidate workflow runs tests and builds a Linux amd64 container. Publication requires explicit workflow dispatch with `publish=true`; it only writes a commit-specific `sha-<commit>` tag, never `latest`.

The companion repository `WeltenbummlerKA/traggo-client-docker` adds favorites synchronization. Its workflow checks out a fixed server commit, builds that exact server locally, then builds the combined image. This avoids silently following upstream tags or requiring access to a private base package.

## Validation and deployment boundary

Run `yarn install --frozen-lockfile --ignore-scripts`, `yarn generate`, TypeScript checking, ESLint, Vitest and Vite in `ui/`. Generate Go models with gqlgen v0.17.85 under its compatible Go 1.25.14 toolchain, then switch to Go 1.27.3 for `go test -race ./...`, `go vet ./...` and the released binaries. The older toolchain is isolated to generation; it is not shipped in the runtime image. The inherited upstream release workflow is restricted to the upstream repository; this fork uses its own candidate validation workflow.

Before deployment, stop the production stack and take a consistent backup of the complete persistent data volume, including the SQLite database and favorites JSON. Test a separate copy with separate ports and a separate volume. Never run the original and candidate servers against the same live database concurrently.

Rollback to an older server also requires considering the token migration: old versions cannot authenticate the hashed token verifiers. Restore the pre-upgrade backup for a full rollback or deliberately revoke sessions and log in again. Restoring an older data snapshot discards subsequent writes, so plan the acceptance window accordingly.

Local tests and a successful image build do not establish live acceptance, browser accessibility, visual calendar behavior, all database dialects or other CPU architectures. Do not replace the production stack until the exact candidate digest has been reviewed and tested with a backup copy.
