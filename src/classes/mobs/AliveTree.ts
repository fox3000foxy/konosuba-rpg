import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class AliveTree extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 11];
    this.love = 100;
    this.hpMax = 550;
    this.hp = this.hpMax;
    this.name = ['Alive Tree', 'Arbre vivant'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['16707', '17201', '17202', '17204', '17206']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_AliveTree, EnglishLore.Creature_AliveTree];
    this.gender = Gender.Male;
  }
}
