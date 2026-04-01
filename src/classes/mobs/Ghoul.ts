import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class Ghoul
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [3, 10];
    this.love = 100;
    this.hpMax = 350;
    this.hp = this.hpMax;
    this.name = ['Ghoul', 'Goule'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['15500', '15501', '15502', '15504']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Ghoul, EnglishLore.Creature_Ghoul];
    this.gender = Gender.Female;
  }
}
