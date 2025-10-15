# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the Vite + React 19 UI written in TypeScript; feature logic lives in `components/`, reusable hooks in `hooks/`, and shared utilities and API helpers in `lib/` and `utils/`.
- `worker/` houses the Cloudflare Worker domain; subfolders (`entities`, `routes`, `usecases`, `impl`) follow the layered architecture and share contracts through `worker/interfaces`.
- `sql/` tracks Cloudflare D1 schema and migrations (see `sql/README.md`); apply schema changes here and reference them from Worker use cases.
- `public/` stores static assets; production artifacts land in `dist/` and should not be edited manually.
- Configuration lives alongside the root (`package.json`, `vite.config.ts`, `wrangler.jsonc`, various `tsconfig.*` files).

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server for the React client on localhost.
- `npx wrangler dev --local`: run the Worker using local bindings; pair with the Vite server when iterating on backend logic.
- `npm run lint`: execute ESLint with the shared TypeScript and React ruleset.
- `npm run build`: type-check (`tsc -b`) and emit production assets to `dist/`.
- `npm run deploy`: build and publish the Worker bundle via Wrangler; run only after all checks and migrations succeed.
- `npm run cf-typegen`: regenerate Worker type bindings after updating D1/R2 resources.

## Coding Style & Naming Conventions
- TypeScript, ES modules, and React FCs are standard; prefer PascalCase for components, camelCase for hooks/utilities, and UPPER_SNAKE_CASE for constants.
- Honor the existing 2-space indentation, trailing semicolons, and single quotes. Run `npm run lint` before committing and address violations instead of disabling rules.
- Favor Tailwind utility classes for styling and compose variants with helpers in `src/components/ui/`. Keep shared design tokens centralized to avoid inline duplication.

## Testing Guidelines
- Automated tests are not yet in place; new features should introduce targeted unit or integration coverage (Vitest or Worker-focused) under `src/__tests__/` or `worker/__tests__/` with filenames ending in `*.test.ts`.
- At minimum, verify `npm run lint` and `npm run build` succeed before submitting changes.
- Document manual verification steps in pull requests, especially when touching Worker routes, migrations, or Cloudflare bindings.

## Commit & Pull Request Guidelines
- Follow the Conventional Commit style shown in history (`feat:`, `refactor:`, `fix:`) with concise present-tense summaries.
- Keep commits focused and mention any UI, schema, or configuration changes that require coordinated deployment.
- Pull requests should describe intent, list manual checks, link issues, and include screenshots for UI-impacting updates.
- Call out required Wrangler secrets, environment variables, or migration commands in the PR body.

## Cloudflare & Data Tips
- Migrations live in `sql/migrations`; apply locally with `npx wrangler d1 migrations apply http_scanner_db`.
- Production deploys must include regenerated D1 bindings (`npm run cf-typegen`) and confirmation that new migrations ran remotely.
- Store non-committed secrets with `wrangler secret put` and avoid hardcoding credentials in Worker modules.
