import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { Creature, type CreatureInterface } from "../Creature";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Milim extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [10, 20];
    this.love = 20;
    this.hpMax = 2000;
    this.hp = this.hpMax;
    this.name = ["Milim Nava", "Milim Nava"];
    this.images = [`enemy_image_22700`, `enemy_image_22701`, `enemy_image_22702`];
    this.prefix = false;
    this.lore = [FrenchLores.Creature_Milim, EnglishLore.Creature_Milim];
    this.gender = Gender.Female;
  }
}
