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

## Grant the test user provider capability

Every authenticated user can book. Creating availability additionally requires
a provider profile. Until provider onboarding is implemented, grant that
capability with the local script:

```bash
pnpm user:grant-provider bruno.student@example.com
```

Alternatively, run this in the Neon SQL editor:

```sql
insert into provider_profiles (user_id)
select id
from "user"
where email = 'bruno.student@example.com'
on conflict (user_id)
do nothing;
```

Call `GET /api/me` to verify `capabilities.canProvide` is `true`, then run
**Create provider slot**.

## Endpoints

| Method | Path                       | Authentication  | Purpose                                 |
| ------ | -------------------------- | --------------- | --------------------------------------- |
| `GET`  | `/api/health`              | No              | Verify the application can query Neon   |
| `POST` | `/api/auth/sign-up/email`  | No              | Create an email/password account        |
| `POST` | `/api/auth/sign-in/email`  | No              | Create a session cookie                 |
| `GET`  | `/api/auth/get-session`    | Cookie          | Read the Better Auth session            |
| `POST` | `/api/auth/sign-out`       | Cookie          | Revoke the current session              |
| `POST` | `/api/auth/sign-in/social` | No              | Start a Google or Microsoft OAuth flow  |
| `GET`  | `/api/me`                  | Cookie          | Read the user and PeerSlot capabilities |
| `GET`  | `/api/slots`               | Cookie          | List future slots for the current user  |
| `GET`  | `/api/slots?teacherId=...` | Cookie          | List a teacher's future slots           |
| `POST` | `/api/slots`               | Provider cookie | Create a future availability slot       |

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
- `403`: signed in, but missing provider capability
- `503`: the application could not reach Neon
