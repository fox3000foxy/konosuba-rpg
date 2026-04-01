# Konosuba RPG - DONE

## Progression
- Level stat multiplier implemented: level 1 = x1.0, +0.2 per level.
- Kazuma uses the global player level.
- Darkness, Aqua, and Megumin use their own character XP/level.
- Phase 1 data model and migrations completed.
- Phase 2 TypeScript services completed (XP model enforced, giveup/execution policies set).
- Run processing feeds character progression and global XP, with level-up/quest integration.
- Affinity DB fields and profile readouts are in place.
- P1 completed: component crafting loop (inline recipe model, validation, atomic updates, `/craft`, tests).
- P2 completed: progression/affinity policy decided and enforced with tests.
- P3 completed: `/character` command + inventory UX polish + FR/EN text validation.

## Combat, drops, and inventory
- Accessory drops are added at the end of combat.
- Affinity gains are credited from dropped accessories.
- Accessory inventory persistence and `/inventory` exposure are in place.
- Consumable drops are added at the end of combat.
- Consumables are integrated into combat flow with real effects.
- Consumable inventory decrements persist during combat.
- Targeted consumable usage works on a selected team member.
- Item consumption on target character is wired.
- Inventory read endpoints are available.
- Component crafting loop (recipe validation, atomic consume/produce, and `/craft` command) is complete.

## Commands and UI
- `/profile` shows player level, character progression, and related stats.
- `/character` command shows per-character level, XP, affinity, and factor.
- Discord interaction routing is extracted from the main entrypoint.
- Monster info output is stabilized with deterministic generic creature rendering.
- Stable monster ids and constructor-based monster lookup are in place.
- Battle title handling preserves `Partie de @mention` outside training.
- Creature text handling now fixes French article selection and elision.
- Menu and battle title helpers are aligned on the shared naming helpers.

## Infra
- GitHub Actions test battery workflow is added.
- Vercel deploy workflow is added on merge to `main`.
- Vercel secrets are configured in the repo.