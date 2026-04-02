import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class DarkRat extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [1, 8];
    this.love = 15;
    this.hpMax = 250;
    this.hp = this.hpMax;
    this.name = ['Dark Rat', 'Rat Ténébreux'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['17500', '17502']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_DarkRat, EnglishLore.Creature_DarkRat];
    this.gender = Gender.Male;
  }
}
