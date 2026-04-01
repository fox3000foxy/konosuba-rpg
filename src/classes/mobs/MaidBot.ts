import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class MaidBot
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [5, 12];
    this.love = 100;
    this.hpMax = 800;
    this.hp = this.hpMax;
    this.name = ['Maid Bot', 'Robot Maid'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['19400', '19401', '19403', '19404']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = FrenchLores.Creature_MaidBot;
    this.gender = Gender.Female;
  }
}
