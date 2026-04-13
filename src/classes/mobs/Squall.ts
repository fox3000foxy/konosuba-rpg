import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { Creature, CreatureInterface } from "../Creature";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Squall extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [5, 11];
    this.love = 50;
    this.hpMax = 600;
    this.hp = this.hpMax;
    this.name = ["Squall", "Squall"];
    // this.color = rand.choice(["16700","16701","16702","16704"]);
    this.images = [`enemy_image_16801`, `enemy_image_16802`];
    this.prefix = false;
    this.lore = [FrenchLores.Creature_Squall, EnglishLore.Creature_Squall];
    this.gender = Gender.Male;
  }
}
