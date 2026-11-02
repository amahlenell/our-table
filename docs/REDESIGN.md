# Our Table visual redesign

The existing application was restyled in place. The framework, dependencies, routes, API behavior, database schema, nutrition calculations, meal-plan logic, authentication, uploads, importing and AI services were retained.

## Restore point

The previous working source is committed as `1255cdc` and tagged `our-table-before-redesign`. The redesign remains a reviewable working-tree diff from that checkpoint. Existing browser-storage keys and cooking-session keys retain their original names so this branding change does not discard local content or progress. The project directory is also retained.

## Visual system

The palette anchors are Espresso `#291C0E`, Cocoa `#6E473B`, Taupe `#A78D78`, Mushroom `#BEB5A9` and Cream `#E1D4C2`. `src/app/globals.css` centralizes these and their tonal derivatives, with semantic surface, text, border and focus tokens. Previous scattered green colours were replaced with those tokens. Photography retains its natural colours.

`src/app/our-table.css` applies rounded cream cards, cocoa pill buttons and active navigation, mushroom secondary controls, soft borders, large photography, generous spacing, consistent form fields and restrained shadows. Recipe titles sit on a cream panel so contrast does not depend on the photograph. Modals retain their Radix behavior and receive the same typography and surfaces. Reduced-motion and print layouts are preserved.

Fredoka is used for branding, headings and prominent numbers. Nunito is used for body text, navigation, buttons, forms, ingredients and instructions. Both exact variable fonts are bundled from the official Google Fonts repository using `next/font/local`, with their SIL Open Font Licenses. Their Git blob hashes were verified. Build-time downloading through `next/font/google` was unavailable here; self-hosting removes both that build dependency and browser font requests to Google. No package dependency was added. See `public/fonts/README.md` for provenance.

## Files changed

- `src/app/globals.css`: palette/typography tokens and replacement of the previous hardcoded colour families.
- `src/app/our-table.css`: shared component skin and desktop/tablet/mobile styling across the application.
- `src/app/layout.tsx`: self-hosted fonts, Our Table page titles and application metadata.
- `src/components/layout/brand.tsx`, `app-shell.tsx`: reusable wordmark, utensil mark and mobile branding.
- `src/components/recipes/recipe-card.tsx`: existing serving yield displayed with time and nutrition.
- Authentication, setup state and recipe attribution presentation: Our Table branding.
- `public/assets/icon.svg` and `public/fonts/`: favicon and licensed fonts.
- Package/lockfile root name, README and case-study copy: display-name alignment; dependency versions are unchanged.
- `tests/e2e/visual-identity.spec.ts`: all-page responsive/font checks and core contrast assertions.

Only the sample author's display name changed in sample data. Existing recipe records were not rewritten. Importer user-agent and internal storage keys intentionally retain their legacy technical names.

## Verification

TypeScript, ESLint, all 37 local tests and the production build passed. The existing live Supabase test remains skipped without test-project credentials. The final browser pass completed all 10 tests. It verified both self-hosted fonts as loaded resources, captured all 13 screens on desktop/mobile and eight tablet views (34 responsive views), and repeated the existing recipe, photo-upload, nutrition, cooking, notes and planning journeys.

Screenshots were inspected for typography, spacing and responsive presentation. Remote sample photography is blocked in the restricted headless test environment; its existing fallback surfaces were checked there, and the photography was also reviewed in the in-app browser. The user-facing screenshot is saved as `../our-table-preview.jpg` alongside the source archive.

Contrast assertions cover primary text, button text, secondary text and input borders. These are targeted checks, not an exhaustive accessibility certification. External services were not reconfigured or called during this frontend-only work.
