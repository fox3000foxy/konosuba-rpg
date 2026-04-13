import { Gender } from "../../objects/enums/Gender";
import { FrenchLores } from "../../objects/enums/FrenchLores";
import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";
import { EnglishLore } from "../../objects/enums/EnglishLore";

export default class Troll extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [5, 13];
    this.love = 100;
    this.hpMax = 800;
    this.hp = this.hpMax;
    this.name = ["Troll", "Troll"];
    this.prefix = true;
  }

  pickColor(rng: Random): string {
    this.color = rng.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006", "11007"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Troll, EnglishLore.Creature_Troll];
    this.gender = Gender.Male;
    return this.color;
  }
}
