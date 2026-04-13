import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import type { Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Slime extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [2, 8];
    this.love = 100;
    this.hpMax = 400;
    this.hp = this.hpMax;
    this.name = ["Slime", "Slime"];
    this.prefix = true;
  }

  pickColor(rng: Random): string {
    this.color = rng.choice(["17700", "17701", "17702", "17704"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Slime, EnglishLore.Creature_Slime];
    this.gender = Gender.Neutral;
    return this.color;
  }
}
