import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class DarkBat
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [2, 9];
    this.love = 15;
    this.hpMax = 300;
    this.hp = this.hpMax;
    this.name = ['Dark Bat', 'Chauve-Souris Ténébreuse'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['20401', '20403', '20404', '20406']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_DarkBat, EnglishLore.Creature_DarkBat];
    this.gender = Gender.Female;
  }
}
