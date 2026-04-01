# Konosuba RPG - Mega TODO

## Vision
Build a multi-character RPG progression system (Kazuma, Darkness, Aqua, Megumin) with:
- XP and levels per character
- Level-based stat factors
- Affinity system (declared now, deeper gameplay later)
- Drop system (affinity items + crafting components)
- Component fusion into potions (later)
- UI based on portraits in `assets/characters-emojis`
- PVP in long-term backlog

Completed work is tracked in [DONE.md](DONE.md).

## Execution roadmap (before adding new features)

### Scope freeze rule
- No new gameplay systems until all P0 and P1 items below are done and tested.
- Allowed during freeze: bug fixes, tests, balancing, docs.
- Not allowed during freeze: PVP, new command families outside inventory/use/craft loop.

### Release gates before new feature development
- Gate A: P0 completed + green tests (`pnpm test`, targeted perf checks).
- Gate B: P1 completed + transactional guarantees verified.
- Gate C: P2 decisions locked + TODO/README aligned.
- Only after Gates A+B+C: reopen roadmap for new systems.

## Phase 5 - Drops and inventory (TODO)

### Combat drops
- Add reward generation at end of run
  - alchemy components

## Phase 6 - Potion crafting from components (TODO)

### Potion effects
- Temporary buffs
- Permanent buffs (to discuss)

## Phase 7 - Character UI assets (based on `assets/characters-emojis`)

### Data preparation
- Mapping `character_key` -> image set
- Potential visual states:
  - normal
  - rare/special
  - high affinity

### Later (not now)
- Integrate visuals into embeds/components
- Add visual target character selection

## Phase 8 - Profile and commands (incremental)

### `/profile`
- Display affinity per character (when useful)

### Future commands
- `/character` (inspect character)
- `/use-item`
- `/craft`
- `/shop` (buy/sell and gold sinks, later)

## Phase 9 - PVP (long-term backlog)
- Design 1v1 player format
- Simple matchmaking
- Multiplier balancing
- PVP rewards (XP/cosmetic drops)

## Open questions
- Character XP -> level formula: same curve as global player (100 XP/level)?
- Do all characters gain XP each run, or only characters that acted?
- Initial level cap?
- Should embeds display the exact factor (`x1.6`)?

## Notes
- Keep compatibility with current services (`progressionService` as orchestrator).
- Avoid breaking changes on existing Discord routes.
- `characters-emojis` visuals are internal UI assets, not Discord emojis.