import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';

export default class Kamachi extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [7, 15];
    this.love = 100;
    this.hpMax = 950;
    this.hp = this.hpMax;
    this.name = ['Kamachi Kaiga', 'Kamachi Kaiga'];
    this.images = [`enemy_image_21200`, `enemy_image_21201`];
    this.prefix = true;
    this.lore = FrenchLores.Creature_Kamachi;
    this.gender = Gender.Male;
  }
}
