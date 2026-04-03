# STRIPPER

Audit des attentes async et des `await` superflus ou évitables.

## Confirmed optimizations

- [src/routes/api.ts](src/routes/api.ts#L186) - le profil chargeait les progressions, le résumé de run et les achievements l’un après l’autre. Ces lectures sont indépendantes et ont été parallélisées.
- [src/services/progressionService.ts](src/services/progressionService.ts#L172) - les récompenses d’accessoires et de consommables étaient traitées séquentiellement après une victoire. Les deux branches sont indépendantes et ont été lancées en parallèle.
- [src/services/gameSessionService.ts](src/services/gameSessionService.ts#L233) - les groupes de boutons indépendants n’avaient pas besoin d’être encodés en série. La création des tokens par groupe est maintenant parallélisée.
- [src/services/progressionService.ts](src/services/progressionService.ts#L190) - les quêtes quotidiennes indépendantes ne doivent pas attendre les unes sur les autres. Les mises à jour ont été parallélisées.

## Intentional waits kept

- [src/interactionReplies/buttons/handleSpecialButton.ts](src/interactionReplies/buttons/handleSpecialButton.ts#L20) - délai de 3s volontaire pour laisser jouer l’animation avant la mise à jour du message.
- [src/utils/discordUtils.ts](src/utils/discordUtils.ts#L1) - délai différé de follow-up conservé, comportement produit intentionnel.
- [src/commandsUpdater.ts](src/commandsUpdater.ts#L107) - sync Discord laissée séquentielle pour l’instant, car le flux rate-limit est conservateur.

## Notes

- Les `Promise.all` déjà présents dans les utilitaires d’image n’ont pas été touchés: ils correspondent déjà à une parallélisation correcte.