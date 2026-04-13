import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { Creature, CreatureInterface } from "../Creature";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Ruijerd extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [7, 16];
    this.love = 20;
    this.hpMax = 1200;
    this.hp = this.hpMax;
    this.name = ["Ruijerd Superdia", "Ruijerd Superdia"];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_22000`, `enemy_image_22001`];
    this.prefix = false;
    this.lore = [FrenchLores.Creature_Ruijerd, EnglishLore.Creature_Ruijerd];
    this.gender = Gender.Male;
  }
}
