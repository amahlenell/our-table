# PrepBook implementation status

## 1. Foundation and design system — implemented

- [x] Next.js App Router, strict TypeScript, React, Tailwind and shadcn-style Radix primitives.
- [x] Cream/sage editorial cookbook, responsive navigation, image fallbacks, loading/empty/error states, dialogs, notifications and reduced-motion styles.
- [x] Explicit browser-local demo, isolated from real Supabase configuration.

## 2. Authentication and households — integration implemented; live verification pending

- [x] Signup, login/logout, recovery, password update, cookie refresh and protected routes.
- [x] Profiles, household creation, targeted 48-hour single-use invitations and a two-member capacity check.
- [x] Server-derived household authorization and private personal records.
- [ ] Apply migration and verify real accounts, confirmation/recovery email and invitation flows in staging.

## 3. Database and recipes — implemented; database not provisioned

- [x] Normalized SQL, composite household foreign keys, indexes, RLS and transactional recipe/food/plan writes.
- [x] Manual and partial drafts, ordered ingredients/steps, photos, tags, search/filter/sort, duplication and confirmed deletion.
- [x] Personal favourites, notes, ratings and timestamps.
- [x] Recipe CRUD and local photo persistence verified in desktop/mobile journeys.
- [ ] Run the live RLS/transaction integration test and cloud photo-access walkthrough.

## 4. Nutrition engine — implemented

- [x] Source kcal, ingredient/serving/batch totals, unknown propagation, gram/kg and ingredient-specific conversions.
- [x] Serving scaling, measured gram equivalents, custom NZ packaging labels and replacement of food matches.
- [x] USDA search/detail integration with server-only key and source attribution.
- [x] Calculation and custom-food browser tests pass.
- [ ] Verify real USDA requests with an API key.

## 5. Meal preparation — implemented

- [x] Three-, four- and five-day plans, separate fractional portions, repeated meals, frozen flags, batch quantities and print styles.
- [x] Storage guidance fields, unknown/over-duration warnings, plan editing/deletion and local persistence.
- [x] Unit tests and desktop/mobile journeys pass for unequal portions and storage warnings.

## 6. Importing — implemented with documented limits

- [x] Socket-address validation, private/reserved rejection, revalidated redirects, robots restrictions, bounds and timeouts.
- [x] JSON-LD extraction, essential-field checks, cleaned text, attribution and editable drafts.
- [x] Parser and URL/rules tests pass.
- [ ] Live website smoke tests. Ingredient text requires manual quantity/unit review; arbitrary sites and automatic photo copying are unsupported.

## 7. AI — integration implemented; provider not configured

- [x] Server-only Responses integration, configurable model, strict Zod output, timeout, hourly quotas and safe errors.
- [x] Creation/adaptation drafts, explicit review before save, no invented food records or nutrition.
- [x] Schema boundary tests pass; missing credentials produce useful errors.
- [ ] Real provider smoke test with key/model configuration.

## 8. Testing and deployment preparation

- [x] TypeScript and ESLint pass without errors or warnings.
- [x] 37 local tests pass; 1 live Supabase test is explicitly skipped without credentials.
- [x] 6 desktop/mobile Playwright journeys pass against the local production build.
- [x] Production build, lockfile install dry-run and production dependency audit pass.
- [x] README, environment example, SQL, architecture diagram, API/deployment/testing/troubleshooting guides and portfolio case study.
- [ ] Development-only minimatch advisory remains in the lint toolchain; review compatible upstream updates. Production audit reports zero advisories.
- [ ] Live database/auth/storage/provider checks, broader accessibility audit and Vercel deployment.

## Exact next step

Create a disposable Supabase staging project, apply `supabase/migrations/202611020001_prepbook.sql`, configure Auth redirects and environment values, and run the gated live test plus DEPLOYMENT.md's three-account walkthrough. Then verify USDA/AI and deploy to Vercel with demo mode disabled. No service credentials were supplied and no deployment has been claimed.
