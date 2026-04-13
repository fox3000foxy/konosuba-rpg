import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import type { Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Knight extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 12];
    this.love = 30;
    this.hpMax = 700;
    this.hp = this.hpMax;
    this.name = ["Cursed Knight", "Chevalier maudit"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["14800", "14802", "14803"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Knight, EnglishLore.Creature_Knight];
    this.gender = Gender.Male;
  }
}
