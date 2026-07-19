# Astro migration M1 verification

Captured: 2026-07-19

Branch: `codex/astro-migration`

M1 introduces Astro as a parallel static build. It does not change the current
production artifact or deploy path.

## Build boundary

| Concern | M1 behavior |
|---|---|
| Legacy Vite UI + Hono Worker | `npm run build:legacy` writes the existing `dist/` artifact |
| Astro SSG | `npm run build:astro` writes `dist-astro/` |
| Production deploy | `npm run deploy` still invokes the legacy build |
| Astro development | `npm run dev:web`; proxies `/api` and `/share` to port 8787 |
| Worker development | `npm run dev:worker`; listens on port 8787 |

Keeping the outputs separate makes the M1 change reversible. Astro will take over
`dist/` only after the homepage and report shell pass their later milestones.

## Dependency result

The build stack now uses Astro 7 with the React and sitemap integrations, Tailwind
through its Vite plugin, Vite 8, Wrangler 4 and the current Hono 4 line. ESLint has
an Astro parser and recommended Astro rules; TypeScript uses a separate strict
`tsconfig.astro.json` without weakening the legacy projects.

The audit count fell from 21 findings to 0. Direct dependencies were upgraded,
and the remaining transitive `flatted` version was updated within its declared
semver range. No automatic `npm audit fix` was used.

## Verification

| Check | Result |
|---|---|
| `npm run test` | Passed, including a Node prerender test for browser-safe PostHog initialization |
| `npm run lint` | Passed; stricter new ESLint 10/React Hooks findings and the existing Fast Refresh findings remain visible as warnings |
| `npm run check` | Passed: Astro diagnostics and both legacy TypeScript projects |
| `npm run build:astro` | Passed; one static page and sitemap emitted to `dist-astro/` |
| `npm run build:legacy` | Passed; legacy client and Worker emitted to `dist/` |
| Astro `/api` proxy | Returned the same Hono 404 response and CORS header as direct port 8787 |
| React hydration | Playwright click changed `Verify React hydration` to `React hydration verified` |
| `git diff --check` | Passed |

The internal Astro page is marked `noindex` and is not wired to deployment. Its
only purpose is to prove SSG, Tailwind, React hydration and the local API boundary
before M2 moves the real homepage.
