# Konosuba RPG

Fan-made RPG project inspired by the Konosuba universe, built for Discord interactions and image-based battles.

## Project Status

### Already implemented

- Core game simulation loop (`processGame`) and URL/action parsing.
- Full monster roster and turn-based combat actions (attack, defend, heal, hug, special).
- Character progression system:
	- Global player XP/level.
	- Per-character XP/level for Darkness, Megumin, and Aqua.
	- Stat scaling integrated into gameplay.
	- Run result persistence wired to both global and character progression.
- Accessory and inventory system:
	- Localized item catalogs (FR/EN).
	- Accessory drops after wins.
	- Affinity gain from dropped accessories.
	- Accessory persistence in `inventory_items`.
	- Inventory API and inventory image rendering.
- Difficulty-aware drops with loot-table style distribution.
- Affinity command and profile display for character progression/affinity overview.
- Discord interaction routing extracted from the main entrypoint.
- Profile/quest/achievement/menu command handlers and API routes.
- Unit and performance test suites (including leak-oriented tests).

### Remaining work (high level)

- Economy and progression balancing pass.
- Expanded affinity gameplay effects.
- Documentation alignment and release-gate tracking (TODO/DONE/README consistency).
- Long-term PVP backlog (explicitly deferred).

Roadmap status is tracked in [TODO.md](TODO.md) and updated as features are validated.

## Assets Attribution

Game visual assets are sourced from **KonoSuba: Fantastic Days** and are used here in a fan-project context.

## Development

### Common commands

- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm test:perf`
- `pnpm test:leaks`
- `pnpm lint`

### Vercel deployment

The repository has a GitHub Actions workflow that deploys to Vercel on pushes to `dev`.

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

To create the Vercel token:

1. Open the Vercel dashboard.
2. Go to your account settings.
3. Open the `Tokens` section.
4. Create a new token and copy it once.
5. Add it to GitHub under `Settings` > `Secrets and variables` > `Actions` > `New repository secret`.

You can find `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` in the local `.vercel/project.json` after linking the project, or by running `vercel link` locally and reusing the generated values.

### Cloudflare Worker deployment

Worker configuration is in [wrangler.toml](wrangler.toml) and Worker entrypoint is [src/worker.ts](src/worker.ts).

Useful commands:

- `pnpm worker:dev`
- `pnpm worker:dry-run`
- `pnpm worker:deploy`
- `pnpm deploy:worker`
- `pnpm deploy:all`

Required secrets (set once via Wrangler):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DISCORD_TOKEN`
- `DISCORD_APPLICATION_ID`

Example:

- `npx wrangler secret put SUPABASE_URL`
- `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
- `npx wrangler secret put DISCORD_TOKEN`
- `npx wrangler secret put DISCORD_APPLICATION_ID`

#### Deployment Architecture

**Cloudflare Workers** now supports the **complete application** including image rendering:

- ✅ All routes supported: Game logic (`/konosuba-rpg/:lang/*`), Discord interactions (`/api/interactions`), image rendering (`/inventory`, `/profile`, `/quest`, `/shop`, `/achievements`)
- ✅ Uses `@cf-wasm/photon/edge-light` for WASM image processing
- ✅ Pre-compiled WASM avoids runtime instantiation restrictions

**Technical detail**: The application was updated to use Cloudflare's optimized WASM build (`@cf-wasm/photon/edge-light`) instead of the standard build, which allows the Worker to bypass the "Wasm code generation disallowed by embedder" restriction.

**Production strategy**:
- Use **Vercel** as primary production deployment (proven stable)
- Use **Cloudflare Workers** for identical functionality with reduced latency
- Both deployments share the same codebase
- Workers provides automatic global edge distribution

## License (Important)

This repository uses a custom **source-available** license in [LICENSE](LICENSE).

### TL;DR

- Source code is available for viewing, downloading, and local evaluation.
- Redistribution is not allowed (source or binaries).
- Commercial use is not allowed.
- Derivative works may be created only for private/local use and may not be distributed.
- This project has **no affiliation** with Studio Deen or related rights holders.
- The application is intended to remain **free to use** with **zero ads**.

### Not Open Source

Although the source code is visible, this license is **not** an open source license and is not OSI-approved.

If you need permissions beyond what is written in [LICENSE](LICENSE), contact the repository owner.
