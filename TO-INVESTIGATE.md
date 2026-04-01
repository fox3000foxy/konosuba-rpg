# TO-INVESTIGATE

## Comportements suspects à vérifier

- ~~La fiche monstre peut varier d’un affichage à l’autre pour les créatures qui passent par `GenericCreature`, parce que `pickColor(new Random())` est appelée au moment de générer l’info. Cela peut changer l’image, et parfois le lore ou la couleur, sans que les tests actuels le bloquent.~~
- ~~Les suggestions d’autocomplétion pour `/infos-monster` exposent des ids internes du type `m0`, `m1`, construits depuis l’index de `generateMob()`. Si l’ordre du roster change, ces ids deviennent fragiles même si le test de combat continue de passer.~~
- ~~Le flux API `/monster/:monsterConstructorName` passe par une résolution indirecte puis régénère la fiche via le nom localisé. Le comportement est correct, mais il peut masquer les différences entre identifiant constructeur, nom affiché et instance réelle.~~
- La réponse d’erreur “monstre invalide” liste tous les monstres valides triés selon la langue. Ce n’est pas un bug, mais l’ordre et le contenu affiché peuvent changer avec le roster ou la locale sans couverture de test dédiée.
- ~~Je n’ai pas vu de test unitaire dédié à la commande `/infos-monster` elle-même ni à son autocomplétion; la couverture est surtout indirecte via `processGame` et les services de difficulté.~~

## Vérifications utiles plus tard

- Vérifier le texte de réponse pour un monstre invalide si on veut réduire le bruit côté UX.
- Garder les tests de non-régression sur la stabilité du rendu et des ids.