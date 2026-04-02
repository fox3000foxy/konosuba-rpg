import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class DarkBear extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 12];
    this.love = 20;
    this.hpMax = 500;
    this.hp = this.hpMax;
    this.name = ['Dark Bear', 'Ours Ténébreux'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['11301', '11303', '11304']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_DarkBear, EnglishLore.Creature_DarkBear];
    this.gender = Gender.Male;
  }
}
