# Our Table: a shared kitchen without the tracking dashboard

## Problem and users

Two people need one reliable home for recipes and a practical way to prepare three to five days of meals. Their portions may differ. They want nutrition transparency without daily calorie logging, fitness analytics, shopping integrations or social feeds. The product combines an editorial cookbook with a small shared household workspace.

## Product decisions

The primary flow is save a recipe, link the ingredients you actually use, then prepare enough portions for both people. Recipe cards make browsing pleasant; the detail view keeps quantities, instructions and notes readable. Cooking mode strips navigation down to one step and a checklist. Soft cream and cocoa, Fredoka headings, Nunito text and large photography establish a warm, rounded kitchen identity. Desktop navigation becomes a fixed bottom bar on mobile; reduced-motion and print layouts are supported.

## Technology and architecture

Next.js App Router provides page routing and server endpoints in one TypeScript project. Tailwind and custom CSS variables establish shared design tokens, while shadcn-style Button and Radix Dialog primitives provide reusable interactions and dialog focus management. Supabase supplies relational storage, cookie Auth and private photos. Domain modules own nutrition and planning independently of UI and providers. Zod validates server inputs and AI outputs. See ARCHITECTURE.md for the implemented Mermaid diagram.

The application contains both a real Supabase adapter and an explicitly isolated browser demo. This permits useful local review without inventing successful cloud operations. Configuring Supabase disables the demo. The repository does not contain secret credentials.

## Nutrition engineering

Nutrition accuracy depends more on missing data and correct ingredient identity than on displaying attractive numbers. Our Table preserves unknown values, source kcal and raw/cooked state. Grams convert directly; volume requires ingredient-specific evidence or a measured equivalent. Ingredient contributions sum at full precision and divide by recipe yield. Changing batch yield scales quantities and batch totals together while per-serving proportions remain stable. AI-generated targets are not treated as verified nutrition.

## Household authorization

Every shared record belongs to a household. Composite foreign keys prevent children from referring to recipes, foods or people in another household. RLS enforces membership even if a client bypasses the UI. Personal notes, ratings and favourites also require the matching user. Membership creation and joining use restricted functions, expiring hashed tokens, verified target email checks, row locks, uniqueness constraints and a two-person cap. API services derive membership from Auth rather than trusting browser household identifiers.

## AI and import safeguards

AI returns a structured recipe draft through the Responses API and Zod schema. It cannot write a recipe or provide nutrient records. The editor requires explicit saving. Existing recipes are adaptation context for new drafts. Timeouts, bounded input/output, redacted errors and database usage counters limit expensive requests. Missing keys leave manual recipes and planning functional.

Importing prioritizes JSON-LD instead of guessing from arbitrary page text. Essential fields must exist. Public-address validation occurs at connection time; redirects are revalidated, payloads and request durations are bounded, and imported text is cleaned. Attribution is retained. Ingredient quantity interpretation remains a visible human-review task and external photography is not copied automatically.

## Meal preparation

Portions are assigned to each member for each meal date. Three days × one portion × two members yields six portions, while unequal portions remain explicit. Batch aggregation respects food identity and conversion basis. Storage duration is recipe-specific, counted from the prep date, and warnings flag unknown or exceeded guidance. Frozen flags are supported without assuming freezing makes every recipe suitable for indefinite storage.

## Testing and evidence

The repository includes pure calculation tests, component tests, parser/schema integration tests, desktop/mobile Playwright journeys and an opt-in live Supabase isolation test. Actual outcomes are recorded in QA.md. No claim is made that live migrations, Auth email delivery, cloud storage or provider calls passed without credentials.

## Remaining engineering work

The next milestone is staging deployment with real service configuration and the full multi-account walkthrough. Realtime collaboration, optimistic concurrency, edit history, automatic orphan-photo cleanup, an indexed server-search API, broader automated accessibility auditing and background cooking notifications are appropriate later improvements. They are documented limitations rather than decorative controls or simulated features.
