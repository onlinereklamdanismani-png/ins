# Deployment Checklist

Use this checklist for the Cloudflare + Vercel + Supabase + Resend launch.

## Local Repo

- `.env` is ignored by Git.
- `.vercel` build output is ignored by Git.
- `node_modules` is ignored by Git.
- `dist` is ignored by Git.
- `npm run build` passes with the Vercel Nitro preset.
- `npm run lint` has no errors.

## GitHub

- Create a private GitHub repository.
- Push this project to the repository.
- Do not upload `.env`.

## Vercel

Import the GitHub repository into Vercel.

Build command:

```txt
npm run build
```

Environment variables:

```txt
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
RESEND_API_KEY
RESEND_FROM
```

## Cloudflare

- Keep the domain DNS in Cloudflare.
- Add the DNS records Vercel gives for the app domain.
- Keep Resend DNS records in Cloudflare.
- Use HTTPS on the final production domain.

## Resend

- Domain is verified.
- `RESEND_FROM` uses the verified domain email.

Example:

```txt
RESEND_FROM=InsightQuotes <hello@example.com>
```

## Production Test

- Visit the live homepage.
- Subscribe with an email.
- Confirm the subscription email.
- Check subscriber status in admin.
- Create or publish an issue.
- Send newsletter to active subscribers.
- Test unsubscribe.
