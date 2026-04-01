import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Quomodo
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [5, 13];
    this.love = 25;
    this.hpMax = 900;
    this.hp = this.hpMax;
    this.name = ['Komodo', 'Komodo'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['15900', '15904']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = FrenchLores.Creature_Quomodo;
    this.gender = Gender.Male;
  }
}
