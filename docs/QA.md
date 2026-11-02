# Verification record

Final local verification: **2 November 2026, Pacific/Auckland**. Windows, Node.js 26.5.0, npm 12.0.2. Tested dependencies are pinned in package.json and package-lock.json.

| Check actually executed                                                     | Result                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `npm run typecheck`                                                         | Passed                                                           |
| `npm run lint`                                                              | Passed, no errors or warnings                                    |
| `npm test`                                                                  | 37 passed, 1 live Supabase test skipped                          |
| `npm run build`                                                             | Passed; pages, API handlers and proxy compiled                   |
| `PLAYWRIGHT_PRODUCTION=true` + `npm run test:e2e`                           | 6 passed against `next start`, 35.5 seconds                      |
| `npm ci --dry-run --ignore-scripts --allow-remote=all --no-audit --no-fund` | Passed; lockfile resolves without reinstalling                   |
| `npm audit --omit=dev --json`                                               | Zero production dependency advisories                            |
| Full `npm audit --json`                                                     | 16 moderate development-only findings; no high/critical findings |

## Browser coverage

After the final mobile layout refinement, the production build passed again and both desktop/mobile overview-and-planner journeys were rerun successfully (2 passed, 22.5 seconds). The source archive includes that final layout.

The same three journeys passed in desktop Edge and an iPhone-sized Chromium/Edge context:

1. Create a recipe with a local photo and multiple tags; save packaging-label nutrition; verify per-serving and batch totals; save/reload notes; advance and reload cooking progress.
2. Search by ingredient; create a three-day plan with unequal individual portions; verify totals, storage warnings and persistence; check mobile page width.
3. Edit a recipe, toggle a favourite, duplicate it and confirm deletion while preserving the original.

Screenshots were rendered and visually reviewed. A cramped mobile hero, clipped sidebar panel and pale secondary text were adjusted. The first development-browser attempt encountered cold compilation beyond a five-second assertion; final tests used the production build. Expanded photo coverage then found a local data-URL validation bug; that boundary was fixed and all six final journeys passed.

## Unverified external behavior

No Supabase, USDA or AI credentials were supplied. The migration has **not** been applied to a live project. Real signup/confirmation/recovery email, multi-account isolation, invitation expiry under a live database, private cloud storage, real URL fetching and provider calls remain staging checks. The opt-in live test is included and explicitly skipped. Local tests do not establish that external services work.

No Vercel deployment, exhaustive accessibility audit, load test or long-running reliability test was performed. Timers are scoped to an open screen. Concurrent cloud edits use last successful save. Imported quantities require human review. See ARCHITECTURE.md and DEPLOYMENT.md for operational limits.

## Development dependency finding

The lint tree includes minimatch 3.1.5 and 10.2.6, covered by [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), a moderate denial-of-service advisory affecting versions below 11.0.1. The 16 audit entries are its development-tooling dependency chain. The automatic forced fix proposed incompatible major/downgrade changes to ESLint/Next configuration and was not applied. Production dependencies audit clean. Review a compatible upstream update before treating dependency maintenance as complete.
