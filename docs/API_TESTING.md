# Testing the PeerSlot API

[Bruno](https://www.usebruno.com/) works well with PeerSlot. The Next.js route
handlers are ordinary HTTP endpoints, and Neon is an implementation detail
behind them. Bruno never connects directly to Neon and never needs the database
connection string.

## Start the application

```bash
pnpm dev
```

The API is available at `http://localhost:3000`.

## Use the included Bruno collection

1. Open Bruno.
2. Choose **Open Collection**.
3. Select the repository's `bruno` directory.
4. Select the `local` environment.
5. Run the requests in numeric order.

Bruno's cookie jar stores the session cookie returned by **Sign in with email**.
The later session, profile, and slot requests reuse that cookie.

Change `testEmail` in `bruno/environments/local.bru` when you want a new user.
Better Auth will reject a duplicate signup, but the existing account can still
sign in.

## Promote the test user to teacher

New profiles are students by default. There is intentionally no public endpoint
that lets a user promote themselves.

To test slot creation, call `GET /api/me` once and then use the local admin
script:

```bash
pnpm user:set-role bruno.student@example.com teacher
```

Alternatively, run this in the Neon SQL editor:

```sql
insert into profiles (user_id, role)
select id, 'teacher'::user_role
from "user"
where email = 'bruno.student@example.com'
on conflict (user_id)
do update set role = excluded.role;
```

Sign in again or call `GET /api/me`, then run **Create teacher slot**.

## Endpoints

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Verify the application can query Neon |
| `POST` | `/api/auth/sign-up/email` | No | Create an email/password account |
| `POST` | `/api/auth/sign-in/email` | No | Create a session cookie |
| `GET` | `/api/auth/get-session` | Cookie | Read the Better Auth session |
| `POST` | `/api/auth/sign-out` | Cookie | Revoke the current session |
| `POST` | `/api/auth/sign-in/social` | No | Start a Google or Microsoft OAuth flow |
| `GET` | `/api/me` | Cookie | Read the user and PeerSlot role |
| `GET` | `/api/slots` | Cookie | List future slots for the current user |
| `GET` | `/api/slots?teacherId=...` | Cookie | List a teacher's future slots |
| `POST` | `/api/slots` | Teacher cookie | Create a future availability slot |

## OAuth testing

Add the relevant provider credentials to `.env.local`, then restart the
development server. Configure these local redirect URLs in the providers:

- Google: `http://localhost:3000/api/auth/callback/google`
- Microsoft: `http://localhost:3000/api/auth/callback/microsoft`

The Bruno social-login requests return an authorization URL when
`disableRedirect` is enabled. Open that URL in a browser to complete the OAuth
flow. Browser testing is more convenient than Bruno for the redirect and
consent portion, while Bruno remains useful for inspecting the initial response
and testing cookie-authenticated API routes.

## Useful status codes

- `200`: request succeeded
- `201`: slot created
- `400`: malformed input
- `401`: missing or invalid session
- `403`: signed in, but not a teacher
- `503`: the application could not reach Neon
