import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class AliveTree
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [4, 11];
    this.love = 100;
    this.hpMax = 550;
    this.hp = this.hpMax;
    this.name = ["Alive Tree", "Arbre vivant"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["16707", "17201", "17202", "17204", "17206"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "L'Arbre Vivant est une créature végétale animée par une magie ancienne et malveillante, capable de frapper avec ses branches comme des fouets. On le trouve dans les forêts maudites aux abords des territoires du Roi Démon, où il protège jalousement son territoire. Sa résistance aux lames ordinaires en fait un adversaire redoutable pour les aventuriers mal équipés. Bien que dépourvu d'intelligence véritable, son instinct de prédation le rend particulièrement dangereux.";
    this.gender = "male";
  }
}
