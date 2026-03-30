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

## Phase 1 - Data model and migrations (high priority)

### DB tables to add
- `character_progress`
  - `user_id` (FK players.user_id)
  - `character_key` (`darkness` | `aqua` | `megumin`)
  - `xp` (int, default 0)
  - `level` (int, default 1)
  - `affinity` (int, default 0)
  - `updated_at`
  - unique constraint: `(user_id, character_key)`

### Future extensions (declare now)
- `inventory_items` (future)
  - stores drops (affinity/components)
- `crafting_recipes` (future)
  - component fusion definitions -> potions
- `player_potions` (future)
  - crafted potion inventory

### Migration script
- Add versioned SQL migration in `supabase/`
- Initial backfill:
  - for each existing player, create the 3 `character_progress` rows
- Add useful indexes:
  - `(user_id)`
  - `(user_id, character_key)` unique

## Phase 2 - TypeScript services (high priority)

### New types
- `CharacterKey` enum
- `CharacterProgress` type
- `CharacterStatsSnapshot` type (final stats after scaling)

### New services
- `characterService.ts`
  - `ensureCharacterProgress(userId)`
  - `getCharacterProgress(userId, character)`
  - `addCharacterXp(userId, character, amount)`
  - `computeLevelFromXp(xp)`
  - `getLevelFactor(level)`

### Gameplay calculation refactor
- Introduce a single stat-scaling point
- Kazuma reads `players.level`
- Darkness/Aqua/Megumin read `character_progress.level`

## Phase 3 - Integrate progression into gameplay (high priority)

### XP gains
- Define end-of-run XP distribution:
  - global player XP (already exists)
  - characters used during the run
- Rules to validate:
  - XP only on win?
  - reduced XP on give up?

### Run processing update
- Extend `recordRunResult` to:
  - keep current global progression
  - feed `character_progress`

## Phase 4 - Affinity (declare now, implement deeper logic later)

### Now
- DB fields exist (`affinity`) + types + read endpoints
- Display affinity in `/profile` (optional)

### Later
- Character-specific affinity consumables
- Different expectations by character
- Gameplay bonuses by affinity thresholds

## Phase 5 - Drops and inventory (TODO)

### Combat drops
- Add loot/drop table
- Add reward generation at end of run
  - affinity accessories (immediate priority)
  - alchemy components
  - combat consumables (after accessories phase)

### Inventory
- Inventory read endpoints
- Item consumption on target character

### Immediate priority (next iteration)
- End-of-combat accessory drops
- Affinity gain based on obtained accessory (bronze/silver/gold/epic)
- Persistence in `inventory_items`
- Basic exposure through `/inventory`

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
- `/inventory` (drops + components)
- `/use-item`
- `/craft`

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
- [ ] Integrate consumables in combat (after accessory stabilization)

## Open questions
- Character XP -> level formula: same curve as global player (100 XP/level)?
- Do all characters gain XP each run, or only characters that acted?
- Initial level cap?
- Should embeds display the exact factor (`x1.6`)?

## Notes
- Keep compatibility with current services (`progressionService` as orchestrator).
- Avoid breaking changes on existing Discord routes.
- `characters-emojis` visuals are internal UI assets, not Discord emojis.
