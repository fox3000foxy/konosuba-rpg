import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';

export default class Beldia extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [8, 16];
    this.love = 100;
    this.hpMax = 2500;
    this.hp = this.hpMax;
    this.name = ['Beldia', 'Beldia'];
    this.images = [`enemy_image_10300`];
    this.prefix = false;
    this.lore = FrenchLores.Creature_Beldia;
    this.gender = Gender.Male;
  }
}
