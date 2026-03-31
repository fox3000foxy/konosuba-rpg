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

## Execution roadmap (before adding new features)

### Scope freeze rule
- No new gameplay systems until all P0 and P1 items below are done and tested.
- Allowed during freeze: bug fixes, tests, balancing, docs.
- Not allowed during freeze: PVP, new command families outside inventory/use/craft loop.

### P0 - Complete consumable combat loop
Goal: make consumables usable in real combat flow with deterministic, testable behavior.

- Integrate consumables into battle action resolution.
- Support item consumption on a selected target character.
- Persist inventory decrements atomically.
- Define command UX for use flow (`/use-item` or interaction equivalent).
- Add unit tests (service), integration tests (run flow), and edge-case tests (empty stock, invalid target, simultaneous updates).

Exit criteria:
- A player can consume a combat item in battle and see the effect immediately.
- Quantity is decremented exactly once per valid use.
- Existing battle actions are not regressed.

### P1 - Implement component crafting loop
Goal: ship first complete craft cycle from components to usable potion.

- Define recipe model and initial recipe set.
- Validate ingredient ownership and quantities.
- Implement atomic component consumption and crafted item creation.
- Expose craft flow (`/craft` command or interaction equivalent).
- Add tests for successful craft, missing ingredients, concurrent craft attempts.

Exit criteria:
- Player can craft at least one potion end-to-end from inventory.
- No partial state on failure (all-or-nothing inventory updates).

### P2 - Clarify progression and affinity policy
Goal: remove gameplay ambiguities before wider content expansion.

- Finalize XP distribution policy:
  - win only or win + give up reduced XP
  - all characters vs only used characters
- Finalize level cap policy.
- Decide profile/embeds factor display policy (show or hide exact multiplier).
- Add tests/documentation reflecting chosen rules.

Exit criteria:
- Policies are documented and enforced by tests.

### P3 - Character-facing polish on existing systems
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

## Progression Rules (to implement)

### Level stat multiplier
- Rule: level 1 => x1.0
- Rule: each level adds +0.2
- Formula: `factor(level) = 1.0 + 0.2 * (level - 1)`
- Examples:
  - level 1 => x1.0
  - level 2 => x1.2
  - level 3 => x1.4

### Level source per character
- Kazuma: uses global player level (already present)
- Darkness, Aqua, Megumin: use their own character XP/level

### Applying the stat factor
- Apply to base character stats:
  - HP
  - attack min/max
  - (optional defense/special scaling if needed)
- Keep rounding consistent (to decide):
  - `Math.round` or `Math.floor` based on gameplay feel

## ~~Phase 1 - Data model and migrations (high priority)~~

### ~~DB tables to add~~
- ~~`character_progress`~~
  - ~~`user_id` (FK players.user_id)~~
  - ~~`character_key` (`darkness` | `aqua` | `megumin`)~~
  - ~~`xp` (int, default 0)~~
  - ~~`level` (int, default 1)~~
  - ~~`affinity` (int, default 0)~~
  - ~~`updated_at`~~
  - ~~unique constraint: `(user_id, character_key)`~~

### ~~Future extensions (declare now)~~
- ~~`inventory_items` (future)~~
  - ~~stores drops (affinity/components)~~
- ~~`crafting_recipes` (future)~~
  - ~~component fusion definitions -> potions~~
- ~~`player_potions` (future)~~
  - ~~crafted potion inventory~~

### ~~Migration script~~
- ~~Add versioned SQL migration in `supabase/`~~
- ~~Initial backfill:~~
  - ~~for each existing player, create the 3 `character_progress` rows~~
- ~~Add useful indexes:~~
  - ~~`(user_id)`~~
  - ~~`(user_id, character_key)` unique~~

## ~~Phase 2 - TypeScript services (high priority)~~

### ~~New types~~
- ~~`CharacterKey` enum~~
- ~~`CharacterProgress` type~~
- ~~`CharacterStatsSnapshot` type (final stats after scaling)~~

### ~~New services~~
- ~~`characterService.ts`~~
  - ~~`ensureCharacterProgress(userId)`~~
  - ~~`getCharacterProgress(userId, character)`~~
  - ~~`addCharacterXp(userId, character, amount)`~~
  - ~~`computeLevelFromXp(xp)`~~
  - ~~`getLevelFactor(level)`~~

### ~~Gameplay calculation refactor~~
- ~~Introduce a single stat-scaling point~~
- ~~Kazuma reads `players.level`~~
- ~~Darkness/Aqua/Megumin read `character_progress.level`~~

## Phase 3 - Integrate progression into gameplay (high priority)

### XP gains
- Define end-of-run XP distribution:
  - ~~global player XP (already exists)~~
  - characters used during the run
- Rules to validate:
  - XP only on win?
  - reduced XP on give up?

### ~~Run processing update~~
- ~~Extend `recordRunResult` to:~~
  - ~~keep current global progression~~
  - ~~feed `character_progress`~~

## Phase 4 - Affinity (declare now, implement deeper logic later)

### Now
- ~~DB fields exist (`affinity`) + types + read endpoints~~
- Display affinity in `/profile` (optional)

### Later
- Character-specific affinity consumables
- Different expectations by character
- Gameplay bonuses by affinity thresholds

## Phase 5 - Drops and inventory (TODO)

### Combat drops
- ~~Add loot/drop table~~
- Add reward generation at end of run
  - ~~affinity accessories (immediate priority)~~
  - alchemy components
  - ~~combat consumables (after accessories phase)~~

### Inventory
- ~~Inventory read endpoints~~
- Item consumption on target character

### Immediate priority (next iteration)
- ~~End-of-combat accessory drops~~
- ~~Affinity gain based on obtained accessory (bronze/silver/gold/epic)~~
- ~~Persistence in `inventory_items`~~
- ~~Basic exposure through `/inventory`~~

## Phase 6 - Potion crafting from components (TODO)

### Fusion system
- Define recipes
- Validate ingredients
- Produce potion
- Atomic component consumption

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
- Display:
  - ~~player level (Kazuma scaling)~~
  - ~~Darkness/Aqua/Megumin progression~~
  - affinity per character (when useful)
  - ~~stacked monsters killed~~

### Future commands
- `/character` (inspect character)
- ~~`/inventory` (drops + components)~~
- `/use-item`
- `/craft`
- `/shop` (buy/sell and gold sinks, later)

## Phase 9 - PVP (long-term backlog)
- Design 1v1 player format
- Simple matchmaking
- Multiplier balancing
- PVP rewards (XP/cosmetic drops)

## Immediate implementation checklist
- [x] ~~Create SQL migration `character_progress`~~
- [x] ~~Add `CharacterKey` enum/type + related types~~
- [x] ~~Create `characterService.ts`~~
- [x] ~~Wire level-based stat scaling~~
- [x] ~~Wire character XP in `recordRunResult`~~
- [x] ~~Add character progression read in `/profile`~~
- [x] ~~Add unit tests for `characterService`~~
- [x] ~~Add integration tests run -> character XP~~
- [x] ~~Refactor routing: extract Discord interactions and API routes out of `index.ts`~~

## Items, drops, and affinity checklist
- [x] ~~Add rarity/type enums for items and accessories~~
- [x] ~~Add localized catalogs (FR/EN) for consumables and accessories~~
- [x] ~~Add search/filter services (`consumableService`, `accessoryService`)~~
- [x] ~~Add unit tests for item/accessory services~~
- [x] ~~Align accessory rarity to 4 tiers (`bronze`, `silver`, `gold`, `epic`)~~
- [x] ~~Add accessory drops at end of combat~~
- [x] ~~Define rarity -> affinity points conversion table~~
- [x] ~~Credit character affinity from dropped accessories~~
- [x] ~~Integrate accessory inventory in `/inventory`~~
- [x] Add consumable drops at end of combat
- [x] Integrate consumables into combat flow with real effect application
- [x] Persist consumable consumption to inventory during combat

### Consumable effects (implemented in battle)
- [x] Potions: restore target character HP (25% basic, 50% gold, 75% epic)
- [x] Chrono: increase target character max HP (+10% basic, +20% gold, +30% epic)
- [x] Stones: increase target character defense (+1 basic, +2 gold, +3 epic)
- [x] Scrolls: increase target character attack (+1 basic, +2 gold, +3 epic)

### Next consumable features
- [ ] Support item selection via URL (e.g. `/USE/I20001000` to use specific item)
- [ ] Validate item ownership before use
- [ ] Support targeting specific team member with consumable

## Open questions
- Character XP -> level formula: same curve as global player (100 XP/level)?
- Do all characters gain XP each run, or only characters that acted?
- Initial level cap?
- Should embeds display the exact factor (`x1.6`)?

## Notes
- Keep compatibility with current services (`progressionService` as orchestrator).
- Avoid breaking changes on existing Discord routes.
- `characters-emojis` visuals are internal UI assets, not Discord emojis.
