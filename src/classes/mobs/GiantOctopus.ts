import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import { type Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class GiantOctopus extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [5, 12];
    this.love = 100;
    this.hpMax = 850;
    this.hp = this.hpMax;
    this.name = ["Giant Octopus", "Poulpe Géant"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["15100", "15101", "15102"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_GiantOctopus, EnglishLore.Creature_GiantOctopus];
    this.gender = Gender.Male;
  }
}
