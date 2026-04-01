import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Destroyer
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [10, 18];
    this.love = 100;
    this.hpMax = 3500;
    this.hp = this.hpMax;
    this.name = ['Destroyer', 'Destroyer'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['19300', '19302']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = FrenchLores.Creature_Destroyer;
    this.gender = Gender.Neutral;
  }
}
