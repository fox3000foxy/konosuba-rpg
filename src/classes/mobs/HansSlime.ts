import { Creature, CreatureInterface } from "../Creature";

export default class HansSlime extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 13];
    this.love = 100;
    this.hpMax = 1100;
    this.hp = this.hpMax;
    this.name = ["Hans", "Hans"];
    this.images = [`enemy_image_14200`];
    this.prefix = true;
    this.lore =
      "Hans est un Général du Roi Démon se présentant sous forme humaine, mais dont le vrai corps est un slime géant toxique capable d'empoisonner une ville entière. Sadique et calculateur, il prend un plaisir manifeste à provoquer une lente agonie chez ses victimes plutôt qu'une mort rapide. Son corps de slime lui permet d'absorber les coups physiques et de se régénérer, rendant les attaques directes peu efficaces. Seule la magie sacrée ou des températures extrêmes peuvent véritablement l'endommager.";
    this.gender = "male";
  }
}
