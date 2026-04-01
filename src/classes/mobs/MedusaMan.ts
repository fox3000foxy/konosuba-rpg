import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';

export default class MedusaMan extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [4, 10];
    this.love = 100;
    this.hpMax = 650;
    this.hp = this.hpMax;
    this.name = ['Medusa Man', 'Homme méduse'];
    this.images = [`enemy_image_22600`, `enemy_image_22601`];
    this.prefix = true;
    this.lore = FrenchLores.Creature_MedusaMan;
    this.gender = Gender.Male;
  }
}
