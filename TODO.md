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

## Current focus (post-optimization, non-PVP)

### P0 - Release readiness
- Keep perf and regressions stable on Vercel: monitor `processGame` and `renderImage` hot paths with targeted checks.
- Complete docs alignment pass (`TODO.md`, `DONE.md`, `README.md`) before reopening roadmap scope.
- Validate command/route compatibility for progression and inventory endpoints after latest optimizations.

### P1 - Product completion (still in freeze)
- Economy balancing pass (prices, sinks, progression pacing).
- UX polish on inventory/crafting flows (messages and edge cases).

### Deferred explicitly
- PVP remains in long-term backlog and is not part of the current execution window.

### Release gates before new feature development
- Gate A: P0 completed + green tests (`bun run test`, targeted perf checks).
- Gate B: P1 completed + transactional guarantees verified.
- Gate C: P2 decisions locked + TODO/README aligned.
- Only after Gates A+B+C: reopen roadmap for new systems.

### Later (not now)
- Integrate visuals into embeds/components
- Add visual target character selection

## Phase 8 - Profile and commands (partial)

### Remaining
- Shop balancing and long-term gold-sink tuning (no new command needed).

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