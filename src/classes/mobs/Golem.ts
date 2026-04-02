import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class Golem extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 10];
    this.love = 100;
    this.hpMax = 900;
    this.hp = this.hpMax;
    this.name = ['Golem', 'Golem'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['11201', '11203']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_Golem, EnglishLore.Creature_Golem];
    this.gender = Gender.Neutral;
  }
}
