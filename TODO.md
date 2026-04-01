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

### P1 - Implement component crafting loop
Goal: ship first complete craft cycle from components to usable potion.

- [x] Define recipe model and initial recipe set.
- [x] Validate ingredient ownership and quantities.
- [x] Implement atomic component consumption and crafted item creation.
- [x] Expose craft flow (`/craft` command or interaction equivalent).
- [x] Add tests for successful craft, missing ingredients, concurrent craft attempts.

Exit criteria:
- Player can craft at least one potion end-to-end from inventory.
- No partial state on failure (all-or-nothing inventory updates).

### P2 - Clarify progression and affinity policy ✅
Goal: remove gameplay ambiguities before wider content expansion.

- Finalize XP distribution policy:
  - win only or win + give up reduced XP
  - all characters vs only used characters
- Finalize level cap policy.
- Decide profile/embeds factor display policy (show or hide exact multiplier).
- Add tests/documentation reflecting chosen rules.

Exit criteria:
- Policies are documented and enforced by tests.

### P3 - Character-facing polish on existing systems ✅

Goal: improve usability of what already exists without expanding scope.

- Add `/character` inspection command using existing progression/affinity/inventory signals.
- Improve inventory readability (grouping, rarity clarity, target compatibility hints).
- Validate FR/EN consistency for newly exposed consumable/crafting texts.

Exit criteria:
- Character progression and item usage are understandable without external docs.

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