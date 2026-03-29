# Konosuba RPG - Mega TODO

## Vision
Mettre en place une progression RPG multi-personnages (Kazuma, Darkness, Aqua, Megumin) avec:
- XP et niveaux par personnage
- Facteurs de stats basés sur le niveau
- Systeme d'affinite (declaration maintenant, gameplay plus tard)
- Systeme de drops (items d'affinite + composants)
- Fusion de composants en potions (plus tard)
- UI basee sur les portraits dans `assets/characters-emojis`
- PVP en backlog long terme

## Regles de progression (a implementer)

### Multiplicateur de stats par niveau
- Regle: niveau 1 => x1.0
- Regle: chaque niveau ajoute +0.2
- Formule: `factor(level) = 1.0 + 0.2 * (level - 1)`
- Exemples:
  - level 1 => x1.0
  - level 2 => x1.2
  - level 3 => x1.4

### Source du niveau selon personnage
- Kazuma: utilise le niveau joueur global (deja present)
- Darkness, Aqua, Megumin: utilisent leur propre XP/niveau de personnage

### Application du facteur de stats
- Appliquer sur stats de base des personnages:
  - HP
  - attack min/max
  - (eventuellement defense/special scaling si necessaire)
- Garder un arrondi coherent (a definir):
  - `Math.round` ou `Math.floor` selon feeling gameplay

## Phase 1 - Data model et migrations (priorite haute)

### Tables DB a ajouter
- `character_progress`
  - `user_id` (FK players.user_id)
  - `character_key` (`darkness` | `aqua` | `megumin`)
  - `xp` (int, default 0)
  - `level` (int, default 1)
  - `affinity` (int, default 0)
  - `updated_at`
  - contrainte unique: `(user_id, character_key)`

### Extensions futures (declarer maintenant)
- `inventory_items` (future)
  - stock des drops (affinite/composants)
- `crafting_recipes` (future)
  - definition des fusions composants -> potions
- `player_potions` (future)
  - inventaire potions craft

### Migration script
- Ajouter migration SQL versionnee dans `supabase/`
- Backfill initial:
  - pour chaque joueur existant, creer les 3 rows `character_progress`
- Ajouter index utiles:
  - `(user_id)`
  - `(user_id, character_key)` unique

## Phase 2 - Services TypeScript (priorite haute)

### Nouveaux types
- `CharacterKey` enum
- `CharacterProgress` type
- `CharacterStatsSnapshot` type (stats finales apres scaling)

### Nouveaux services
- `characterService.ts`
  - `ensureCharacterProgress(userId)`
  - `getCharacterProgress(userId, character)`
  - `addCharacterXp(userId, character, amount)`
  - `computeLevelFromXp(xp)`
  - `getLevelFactor(level)`

### Refactor du calcul gameplay
- Introduire un point unique de scaling des stats
- Kazuma lit `players.level`
- Darkness/Aqua/Megumin lisent `character_progress.level`

## Phase 3 - Integrer la progression dans le jeu (priorite haute)

### Gains XP
- Definir repartition XP fin de run:
  - joueur global (deja existant)
  - personnages utilises dans la run
- Regles a valider:
  - XP uniquement sur win?
  - XP reduite si giveup?

### Mise a jour run processing
- Etendre `recordRunResult` pour:
  - maintenir la progression globale actuelle
  - alimenter `character_progress`

## Phase 4 - Affinite (declaration maintenant, logique plus tard)

### Maintenant
- Champs DB presents (`affinity`) + types + endpoints lecture
- Afficher affinite dans `/profile` (optionnel)

### Plus tard
- Consommables d'affinite par personnage
- Attentes differentes par personnage
- Bonus gameplay selon paliers d'affinite

## Phase 5 - Drops et inventaire (TODO)

### Drops de combat
- Ajouter table de loot/drop
- Ajouter generation de recompenses en fin de run
  - items d'affinite
  - composants d'alchimie

### Inventaire
- Endpoints lecture inventaire
- Consommation item sur personnage cible

## Phase 6 - Crafting potions via composants (TODO)

### Systeme de fusion
- Definir recettes
- Validation des ingredients
- Production de potion
- Consommation atomique des composants

### Effets potions
- Buff temporaires
- Buff permanents (a debattre)

## Phase 7 - UI Assets personnages (basee sur `assets/characters-emojis`)

### Preparation data
- Mapping `character_key` -> set d'images
- Etats visuels potentiels:
  - normal
  - rare/special
  - affinite high

### Plus tard (pas maintenant)
- Integrer ces visuels dans les embeds/composants
- Ajouter selection visuelle du personnage cible

## Phase 8 - Profile et commandes (incremental)

### `/profile`
- Afficher:
  - niveau joueur (Kazuma scaling)
  - progression Darkness/Aqua/Megumin
  - affinite par perso (quand utile)
  - monstres tues stackes (deja fait)

### Commandes futures
- `/character` (inspect personnage)
- `/inventory` (drops + composants)
- `/use-item`
- `/craft`

## Phase 9 - PVP (backlog long terme)
- Concevoir format 1v1 joueurs
- Matchmaking simple
- Equilibrage des multiplicateurs
- Recompenses PVP (XP/drops cosmetiques)

## Checklist implementation immediate
- [ ] Creer migration SQL `character_progress`
- [ ] Ajouter enum/type `CharacterKey` + types associes
- [ ] Creer `characterService.ts`
- [ ] Brancher scaling des stats par niveau
- [ ] Brancher XP perso dans `recordRunResult`
- [ ] Ajouter lecture progression perso dans `/profile`
- [ ] Ajouter tests unitaires `characterService`
- [ ] Ajouter tests integration run->xp perso

## Questions ouvertes
- Formule XP->level pour personnages: meme courbe que joueur global (100 XP/level) ?
- Est-ce que tous les persos gagnent XP a chaque run, ou seulement ceux qui ont agit ?
- Limite de niveau initiale (cap)?
- Faut-il afficher le facteur exact (`x1.6`) dans les embeds ?

## Notes
- Garder la compatibilite avec les services actuels (`progressionService` orchestrateur).
- Eviter les breaking changes sur les routes Discord existantes.
- Les visuels `characters-emojis` sont consideres comme assets UI internes, pas emojis Discord.
