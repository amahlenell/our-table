# API integrations

All API responses are JSON. Errors use `{ "error": "helpful message" }`. Mutation requests require a same-origin `Origin` header and a valid cookie session. Every household endpoint resolves membership on the server. No caller-provided household UUID is trusted. API keys are server environment values only.

| Endpoint              | Method         | Purpose                                                            |
| --------------------- | -------------- | ------------------------------------------------------------------ |
| `/api/data`           | GET            | Authenticated household recipes, plans, foods, profile and members |
| `/api/profile`        | POST           | Update own display name                                            |
| `/api/household`      | POST           | Transactionally create a household and owner membership            |
| `/api/invitation`     | POST           | Owner creates targeted, expiring token; raw token returned once    |
| `/api/join`           | POST           | Join with a token and matching verified email                      |
| `/api/recipes`        | POST           | Validate and transactionally save a recipe and child rows          |
| `/api/recipes/{uuid}` | DELETE         | Delete after checking plan references                              |
| `/api/personal`       | POST           | Save own favourite, notes and rating                               |
| `/api/plans`          | POST           | Validate and transactionally save plan, entries and portions       |
| `/api/plans/{uuid}`   | DELETE         | Delete household plan                                              |
| `/api/images`         | POST multipart | Validate, re-encode and upload photo; return signed URL and path   |
| `/api/foods?q=…`      | GET            | USDA food search, limited to 12 choices                            |
| `/api/foods`          | POST           | Save packaging-label record or re-fetch USDA ID before saving      |
| `/api/import`         | POST           | Public JSON-LD recipe draft; no automatic save                     |
| `/api/ai`             | POST           | Structured AI draft; no nutrition and no automatic save            |

## USDA

Set `USDA_API_KEY`. Requests use the official FoodData Central endpoints. Food IDs, descriptions, data type and per-100-g nutrients are retained. Nutrient identifiers: kcal 1008 (or 2047/2048), protein 1003, carbs 1005, fat 1004, fibre 1079. Energy records must explicitly use kcal; missing calories stay missing. The current integration intentionally does not infer gram conversions from loosely described portions. Use measured gram equivalents in the ingredient editor. Review raw versus cooked state, edible portions and brand labels yourself.

Reference: [FoodData Central API guide](https://fdc.nal.usda.gov/api-guide/).

## AI

The OpenAI Docs skill was used to check the Responses structured-output interface. Set `OPENAI_API_KEY` and an explicit `AI_MODEL` that supports Responses structured outputs. There is no hardcoded model guess. Zod derives the strict JSON schema and validates the parsed result. Prompts are bounded, requests time out, usage is limited and secret-bearing provider errors are redacted. Existing recipe text can be supplied as context for a **new** draft; original recipes are not overwritten. The generated content is editable and saving is always explicit. Nutrition requirements in a prompt remain unverified goals until ingredients have real food records.

Reference: [Official structured outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

## Supabase

Cookie-based browser and server clients use the publishable key. API requests call `getUser` rather than trusting a decoded client session. The application does not use a service-role key. The only documented service-role use is the explicitly gated disposable-project integration test. Do not put it in any `NEXT_PUBLIC_` value.

Reference: [Supabase server-side client documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
