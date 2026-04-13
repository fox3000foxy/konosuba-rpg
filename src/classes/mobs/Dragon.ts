import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import { type Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Dragon extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [12, 20];
    this.love = 80;
    this.hpMax = 5000;
    this.hp = this.hpMax;
    this.name = ["Dragon", "Dragon"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["15400", "15401", "15402", "15404"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Dragon, EnglishLore.Creature_Dragon];
    this.gender = Gender.Male;
  }
}
