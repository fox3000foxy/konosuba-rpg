import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { Creature, CreatureInterface } from "../Creature";
import { EnglishLore } from "../../objects/enums/EnglishLore";

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
    this.lore = [FrenchLores.Creature_HansSlime, EnglishLore.Creature_HansSlime];
    this.gender = Gender.Male;
  }
}
