import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class PigWoman
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [3, 9];
    this.love = 5;
    this.hpMax = 550;
    this.hp = this.hpMax;
    this.name = ["Pig Woman", "Femme cochon"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["11101", "11104", "11105", "11102"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "La Femme Cochon est une créature humanoïde porcine souvent croisée dans les villes et marchés louches, où elle gère des commerces douteux avec une ruse animale. Peu dangereuse en combat ouvert, elle compense par des pièges, des appels à la garde ou des complices cachés dans les ruelles. Sa nature cupide la rend corruptible, mais tenter de la soudoyer sans y mettre le prix peut facilement se retourner contre soi. Elle constitue moins une menace physique qu'un obstacle social et économique pour les aventuriers.";
    this.gender = "female";
  }
}
