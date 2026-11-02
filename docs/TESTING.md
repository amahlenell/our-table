# Testing

## Local checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Unit tests use synthetic nutrient fixtures, never presented as verified production data. Coverage includes source kcal, missing nutrients, zero quantities, gram/kg and ingredient-specific conversions, gram-equivalent scaling, invalid servings, unequal meal portions, six-wrap calculation, aggregation boundaries, month/year/DST dates and fridge duration flags. A React Testing Library component test verifies displayed calculated nutrition and the personal-favourite action.

Integration tests cover JSON-LD graphs and instruction sections, refusal of incomplete imports, private/reserved URL rejection, USDA mapping, strict recipe/plan validation and AI response boundaries. Network calls are not exercised by these parser/schema tests. They do not establish live provider availability.

Playwright uses installed Edge in desktop and iPhone-sized Chromium contexts. It creates a recipe, links custom packaging nutrition, scales servings and totals, saves and reloads notes, navigates cooking steps and reloads progress. A second journey covers ingredient search, unequal portions, storage warnings, persisted plans and page overflow. The development server compiles routes on demand, so assertions allow 15 seconds for cold navigation. No fixed sleeps are used. Use an isolated fresh context for each test.

For a production-build local test, stop the dev server, run `npm run build`, set `$env:PLAYWRIGHT_PRODUCTION='true'`, then `npm run test:e2e`. The build must have `NEXT_PUBLIC_DEMO_MODE=true` and blank Supabase variables, because public flags are baked into the bundle. Do not deploy that demo build as your private real household.

## Optional live Supabase integration

Apply the migration to a disposable project, then set these **test-process-only** variables:

```powershell
$env:TEST_SUPABASE_URL='https://YOUR_TEST_PROJECT.supabase.co'
$env:TEST_SUPABASE_PUBLISHABLE_KEY='YOUR_TEST_PUBLISHABLE_KEY'
$env:TEST_SUPABASE_SERVICE_ROLE_KEY='YOUR_TEST_SERVICE_ROLE_KEY'
npm test
```

The test creates three verified disposable Auth users. It checks household creation, wrong-email invitation rejection, correct join, token reuse rejection, cross-account recipe creation/editing, outsider isolation, private notes and transaction rollback on invalid food relationships. Cleanup runs in `finally`. When any variable is absent the test is explicitly skipped. These variables must never be committed, added to the browser, or reused against a production project.

This harness verifies database permissions through the real Supabase API when configured. It is not a browser test of email delivery or password recovery. Full live authentication E2E, signed storage access, accessibility auditing and real USDA/AI provider smoke tests remain staging checks documented in DEPLOYMENT.md.
