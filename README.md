# AgentID

AgentID is the identity layer for AI agents. It lets an AI agent carry a time-limited cryptographic certificate proving its operator has authenticated via BankID. Third-party services verify the certificate offline using standard RS256 JWT verification — no round-trip to AgentID required.

---

## How it works

1. An AI agent calls `POST /api/auth/start` to request a new certificate.
2. AgentID creates a BankID session and returns an `authUrl` to display to the user.
3. The user opens the URL, scans the BankID QR code, and approves.
4. The agent polls `GET /api/auth/status` until `status: "complete"`.
5. The agent attaches the signed JWT (`X-AgentID-Token`) to all subsequent requests.
6. Any third-party service verifies the JWT signature using the public key at `/api/jwks`.
7. The certificate expires after 1 hour — repeat from step 1.

---

## API

### `POST /api/auth/start`

Initiate a BankID authentication session.

**Response**
```json
{
  "sessionId": "uuid",
  "authUrl": "https://agentidapp.vercel.app/auth/<sessionId>",
  "expiresAt": "2026-01-01T00:00:00.000Z"
}
```

---

### `GET /api/auth/status?sessionId=<id>`

Poll for the result of an authentication session.

**Response**
```json
{
  "status": "pending | complete | failed",
  "jwt": "<signed RS256 JWT>"
}
```

`jwt` is only present when `status` is `"complete"`.

---

### `GET /api/jwks`

Public JWK set for offline RS256 JWT verification. Fetch once and cache for 1 hour.

---

## JWT certificate

Issued tokens use RS256 and contain:

```json
{
  "iss": "agentid",
  "sub": "a3f8c2d1e4b7…",
  "auth_method": "bankid",
  "iat": 1700000000,
  "exp": 1700003600,
  "jti": "uuid-v4"
}
```

- `sub` is a stable pseudonymous identifier — `HMAC-SHA256(secret, personalNumber)`. Same person always maps to the same value, but the personal number is never exposed.
- `exp` is always `iat + 3600` (1 hour).
- `jti` is unique per token.

---

## Running locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create a `.env.local` file. Generate RSA keys and the HMAC secret with:

```bash
node scripts/generate-keys.mjs
```

| Variable | Required | Description |
|---|---|---|
| `GRANDID_BASE_URL` | Yes | GrandID API base URL |
| `GRANDID_API_KEY` | Yes | GrandID API key |
| `GRANDID_SERVICE_KEY` | Yes | GrandID service key |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL of this service |
| `JWT_PRIVATE_KEY` | Yes | RSA-2048 private key (PEM, base64-encoded) |
| `JWT_PUBLIC_KEY` | Yes | RSA-2048 public key (PEM, base64-encoded) |
| `JWT_HMAC_SECRET` | Yes | 32-byte hex secret for pseudonymous sub derivation |
| `REDIS_URL` | Prod only | Redis connection string for persistent session storage |

---

## Security

- **RS256** — asymmetric signing; the private key never leaves the server.
- **Pseudonymous identity** — personal numbers are never stored or exposed in JWTs.
- **Offline verification** — consumers fetch the public key from `/api/jwks` once and verify locally. No runtime dependency on AgentID.
- **Short-lived tokens** — 1-hour expiry limits the blast radius of a leaked token.
- **Session isolation** — each BankID session maps to a single-use AgentID session stored in Redis with a 10-minute TTL for pending sessions.

---

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [GrandID / E-identitet](https://www.grandid.com) — BankID integration
- [jose](https://github.com/panva/jose) — RS256 JWT signing and JWKS
- [Redis](https://redis.io) — session storage (via Vercel Storage Marketplace)
- Deployed on [Vercel](https://vercel.com)
