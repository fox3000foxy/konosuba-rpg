import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, type GenericCreatureInterface } from "../GenericCreature";
import { type Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class GiantEarthworm extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 10];
    this.love = 100;
    this.hpMax = 800;
    this.hp = this.hpMax;
    this.name = ["Giant Earthworm", "Ver de terre Géant"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["11500", "11501", "11503"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_GiantEarthworm, EnglishLore.Creature_GiantEarthworm];
    this.gender = Gender.Male;
  }
}
