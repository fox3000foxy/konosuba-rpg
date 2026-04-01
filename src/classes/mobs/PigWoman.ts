import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class PigWoman
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [3, 9];
    this.love = 5;
    this.hpMax = 550;
    this.hp = this.hpMax;
    this.name = ['Pig Woman', 'Femme cochon'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['11101', '11104', '11105', '11102']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = FrenchLores.Creature_PigWoman;
    this.gender = Gender.Female;
  }
}
