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
- Accessory and inventory system:
	- Localized item catalogs (FR/EN).
	- Accessory drops after wins.
	- Affinity gain from dropped accessories.
	- Inventory API and inventory image rendering.
- Difficulty-aware drops with loot-table style distribution.
- Discord interaction routing extracted from the main entrypoint.
- Profile/quest/achievement/menu command handlers and API routes.
- Unit and performance test suites (including leak-oriented tests).

### Remaining work (high level)

- Consumables integration in real combat flow.
- Crafting system (components to potions).
- Expanded affinity gameplay effects.
- More character-focused commands (`/character`, richer `/inventory`, item usage/crafting actions).
- Long-term PVP backlog.

See the complete tracked roadmap in [TODO.md](TODO.md).

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
