import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { Creature, CreatureInterface } from "../Creature";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Vanir extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 14];
    this.love = 30;
    this.hpMax = 1300;
    this.hp = this.hpMax;
    this.name = ["Vanir", "Vanir"];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_17800`];
    this.prefix = false;
    this.lore = [FrenchLores.Creature_Vanir, EnglishLore.Creature_Vanir];
    this.gender = Gender.Male;
  }
}
