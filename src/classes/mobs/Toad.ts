import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import { type Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Toad extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [3, 8];
    this.love = 50;
    this.hpMax = 450;
    this.hp = this.hpMax;
    this.name = ["Toad", "Crapaud"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["16700", "16701", "16702", "16704"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Toad, EnglishLore.Creature_Toad];
    this.gender = Gender.Male;
  }
}
