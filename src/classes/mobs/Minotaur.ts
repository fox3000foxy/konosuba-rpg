import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class Minotaur extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 14];
    this.love = 100;
    this.hpMax = 900;
    this.hp = this.hpMax;
    this.name = ['Minotaur', 'Minotaure'];
    this.images = [`enemy_image_18300`, `enemy_image_18301`];
    this.prefix = true;
    this.lore = [FrenchLores.Creature_Minotaur, EnglishLore.Creature_Minotaur];
    this.gender = Gender.Male;
  }
}
