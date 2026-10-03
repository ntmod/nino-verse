# NoriNote accounts

Google is currently the only enabled sign-in method. Email/password signup, login, verification, and password reset are disabled on both the UI and API. A verified Google email identifies the account; no email delivery service is required.

## Configuration

Set these server environment variables locally and in the deployment:

```dotenv
BETTER_AUTH_URL=http://localhost:3000
SESSION_SECRET=<existing random secret, at least 32 characters>
GOOGLE_CLIENT_ID=<Google OAuth web application client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
```

Google authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

Add the equivalent HTTPS redirect URI for the production domain. `BETTER_AUTH_URL` must be the exact app origin for that environment. Restart the development server after changing `.env`.

Do not paste secrets into chat or commit `.env`. `SITE_PASSWORD` no longer authenticates web users; the old shared session does not grant access.

## Existing data

All unowned transactions, categories, payment methods, budgets, fixed costs, and daily-average configuration belong to **ntmod001@gmail.com**. After that account verifies its email and accesses the data APIs, the server adds its user ID to these records, then writes a completion marker. This is idempotent and preserves IDs, values, and dates. Other accounts never see unowned records. No production records have been migrated during development tests.

A new account starts with an empty notebook. Its categories and payment methods must be created before recording transactions.

## Watch integration

The existing hashed Watch token remains restricted to the original Quick Expense routes. It resolves to the verified account specified by `WATCH_USER_EMAIL`, defaulting to `ntmod001@gmail.com`. First sign in and verify that account before using the Watch integration. Web cookies from the old shared-password login are not accepted.

## Checks

```sh
node lib/user-scope.test.mjs
node lib/account-isolation.test.cjs
node lib/payment-balance.test.mjs
npx tsc --noEmit
```

The API isolation check executes actual route handlers against an isolated in-memory store; it does not contact MongoDB or send mail. With Google credentials configured, test Google sign-in, repeated sign-in with the same email, a second account, and logout. Confirm that owner history and wallet balances are intact and the second account is empty.

References: [Better Auth Next.js](https://better-auth.com/docs/integrations/next), [Google provider](https://better-auth.com/docs/authentication/google), [Email/password](https://better-auth.com/docs/authentication/email-password), [Resend send email](https://resend.com/docs/api-reference/emails/send-email).
