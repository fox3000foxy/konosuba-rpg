import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class Hydra extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 13];
    this.love = 100;
    this.hpMax = 1000;
    this.hp = this.hpMax;
    this.name = ['Hydra', 'Hydre'];
    this.images = [`enemy_image_21800`, `enemy_image_21801`];
    this.prefix = true;
    this.lore = [FrenchLores.Creature_Hydra, EnglishLore.Creature_Hydra];
    this.gender = Gender.Female;
  }
}
