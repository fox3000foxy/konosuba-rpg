import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class DarkWolf extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [5, 13];
    this.love = 100;
    this.hpMax = 950;
    this.hp = this.hpMax;
    this.name = ['Dark Wolf', 'Loup ténébreux'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['15800', '15801', '15803']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_DarkWolf, EnglishLore.Creature_DarkWolf];
    this.gender = Gender.Male;
  }
}
