import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { Creature, type CreatureInterface } from "../Creature";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class KingTroll extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [7, 15];
    this.love = 100;
    this.hpMax = 1500;
    this.hp = this.hpMax;
    this.name = ["King Troll", "Roi Troll"];
    this.images = [`enemy_image_10001`, `enemy_image_10004`];
    this.prefix = true;
    this.lore = [FrenchLores.Creature_KingTroll, EnglishLore.Creature_KingTroll];
    this.gender = Gender.Male;
  }
}
