import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import type { Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class LoveBunny extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [1, 6];
    this.love = 20;
    this.hpMax = 200;
    this.hp = this.hpMax;
    this.name = ["Love Bunny", "Love Bunny"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["16001", "16002", "16003"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_LoveBunny, EnglishLore.Creature_LoveBunny];
    this.gender = Gender.Neutral;
  }
}
