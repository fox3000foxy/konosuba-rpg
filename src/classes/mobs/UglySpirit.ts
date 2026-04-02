import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class UglySpirit extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [3, 12];
    this.love = 100;
    this.hpMax = 550;
    this.hp = this.hpMax;
    this.name = ['Ugly Spirit', 'Esprit hideux'];
    // this.color = rand.choice([<"11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_21500`, `enemy_image_21501`];
    this.prefix = true;
    this.lore = [FrenchLores.Creature_UglySpirit, EnglishLore.Creature_UglySpirit];
    this.gender = Gender.Male;
  }
}
