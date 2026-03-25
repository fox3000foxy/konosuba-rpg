# Tests perf et détection de leaks

## Commandes

- Tests complets: pnpm test
- Tests de performance: pnpm test:perf
- Test fuite mémoire (simulation): pnpm test:leaks

## Ce que couvrent les tests

- Mécaniques de base: RNG, Player, Creature
- Intégration mécanique: processUrl, processGame
- Robustesse des mobs: instanciation de toutes les entrées mobMap
- Performance simulation: boucle de parties sans rendu image
- Dérive mémoire simulation: répétitions avec GC explicite

## Où chercher les leaks en priorité

Les risques principaux sont côté rendu image, pas côté simulation.

1) Caches globaux sans limite dans src/utils/renderImage.ts
- imageCache
- base64Cache
- photonCache
- layerCache
- uiPhotonCache
- fontCache

2) Clés de cache très variables
- layerCache clé basée sur JSON.stringify de hp/images
- uiPhotonCache clé basée sur JSON.stringify de hp/messages/state/lang

Quand les messages changent souvent, uiPhotonCache peut grandir en continu.

## Profilage Node recommandé

1. Lancer le serveur avec inspecteur:
   node --inspect-brk ./node_modules/.bin/ts-node-dev src/index.ts

2. Ouvrir Chrome DevTools (chrome://inspect) puis Memory.

3. Prendre un snapshot de base.

4. Jouer 200-500 requêtes game et reprendre un snapshot.

5. Comparer les retained objects:
- PhotonImage
- Map entries
- ArrayBuffer
- Uint8Array

## Interprétation rapide

- Si la simulation seule reste stable et la version avec rendu dérive, la fuite est dans renderImage.
- Si la mémoire JS semble stable mais le process grossit, suspecter la mémoire WASM (Photon/Resvg) et les objets non libérés.
