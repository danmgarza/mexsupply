# Database

Canonical schema lives in `supabase/migrations`.

For local development:

1. Install dependencies with `npm install`.
2. Start Supabase with `npx supabase start`.
3. Apply migrations and seed data with `npx supabase db reset`.

For environments where only a Postgres connection string is available, run:

```bash
npm run db:migrate
```
