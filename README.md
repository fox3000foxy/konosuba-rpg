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

- Consumables integration in real combat flow.
- Item consumption on target character.
- Crafting system (components to potions).
- Expanded affinity gameplay effects.
- More character-focused commands (`/character`, `/use-item`, `/craft`).
- Long-term PVP backlog.
- XP distribution rule finalization ("used characters only" and win/giveup policy).

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
