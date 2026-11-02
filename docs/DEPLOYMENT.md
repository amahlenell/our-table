# Deploy to Vercel and Supabase

No deployment was performed during this build because no hosting or service credentials were supplied.

## 1. Supabase database and Auth

Create a new hosted project and apply `supabase/migrations/202611020001_prepbook.sql` using the SQL editor. Alternatively, use the Supabase CLI in this directory: `supabase login`, `supabase link --project-ref YOUR_PROJECT_REF`, then `supabase db push`. Use the actual project ref from your dashboard. The migration is for a fresh database and is applied once; don't repeatedly paste it into an existing installation. `seed.sql` deliberately contains no fake production recipes.

Check that all tables have RLS enabled and the `recipe-photos` bucket is private. Set email/password authentication, email confirmation, password policy, SMTP and provider-level Auth rate limits. Use a password minimum of 12 characters to match the UI. Review Supabase's password/security options for your project.

## 2. Vercel

1. Put this project in your GitHub repository, keeping `.env.local`, `.next`, test reports and dependencies out of Git.
2. In Vercel, import that repository. If this remains inside a larger repository, choose this project's directory as the Root Directory.
3. Select Next.js and Node.js 24.x (24.15 or later), or 26.x when available on your Vercel account. Use `npm ci` for install and `npm run build` for build. The application uses Node runtime routes, not a static export.
4. Set the environment variables below in Vercel's environment settings. Keep secrets out of source and screenshots.
5. Deploy. Public variables are included at build time, so redeploy after changing them.
6. Add the final HTTPS domain to Supabase Site URL and redirect allowlist: `/auth/callback` and `/auth/callback?type=recovery`. Add Vercel preview URLs only when intentionally testing an isolated database.
7. Run the live verification below before using real recipes.

| Variable                               | Required                | Visibility / role                                                                           |
| -------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes for real accounts   | Public project URL                                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes for real accounts   | Public; RLS enforces security                                                               |
| `NEXT_PUBLIC_DEMO_MODE`                | Set false in production | Explicit local sample mode only                                                             |
| `NEXT_PUBLIC_APP_URL`                  | Recommended             | Canonical domain for documentation/integration setup; Auth callbacks use the current origin |
| `USDA_API_KEY`                         | Optional                | Server only; enables food lookup                                                            |
| `OPENAI_API_KEY`                       | Optional                | Server only; enables AI drafts                                                              |
| `AI_MODEL`                             | Required with AI key    | Explicit Responses model supporting structured output                                       |

There is no application service-role credential. Use only the publishable key in browser configuration. Verify that the browser bundle contains neither provider secret.

## 3. Live acceptance walkthrough

- Sign up as the first person, verify email, create a household and invite the second person's exact email.
- Sign up and verify as the second person, accept the token and confirm it cannot be reused.
- Create a recipe, upload a photo, link a USDA entry and save a custom NZ packaging label. Confirm the second account sees the recipe after refresh.
- Edit ingredients from the second account and confirm calculations and batch scaling.
- Add personal notes, rating and favourite in one account; confirm the other account does not see them.
- Create a three-day plan with unequal portions. Verify batch quantities, a frozen portion, storage flags and print output.
- Create a third, unrelated account. Verify table access and photo access are denied and guessed recipe routes reveal no data.
- Test password recovery through real email delivery and the deployed callback URL.
- Import one accessible JSON-LD recipe, try a blocked/private URL, then generate and review an AI draft. Disconnect AI credentials and verify manual workflows still work.

## Operational notes

Use separate development/staging and production Supabase projects. The optional live test creates and deletes users; never point it at a daily-use project. Configure Supabase backups and monitor usage/quotas. AI/import limits are persisted in PostgreSQL; provider quotas may impose lower limits. Vercel's request body limit also applies to photo upload. Abandoned photo cleanup and automated database backup procedures are not configured by this repository. Database migrations, signed URLs and RLS must be verified in staging before calling the system production-ready.
