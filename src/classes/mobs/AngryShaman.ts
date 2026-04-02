import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature } from '../Creature';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class AngryShaman extends Creature implements Creature {
  constructor() {
    super();
    this.attack = [5, 12];
    this.love = 100;
    this.hpMax = 500;
    this.hp = this.hpMax;
    this.name = ['Angry Shaman', 'Chaman Énervé'];
    this.images = [`enemy_image_22800`, `enemy_image_22801`];
    this.prefix = true;
    this.lore = [FrenchLores.Creature_AngryShaman, EnglishLore.Creature_AngryShaman];
    this.gender = Gender.Male;
  }
}
