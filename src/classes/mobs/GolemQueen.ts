import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class GolemQueen extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [9, 16];
    this.love = 100;
    this.hpMax = 2200;
    this.hp = this.hpMax;
    this.name = ['Golem Queen', 'Reine Golem'];
    this.prefix = false;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['14300', '14301']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_GolemQueen, EnglishLore.Creature_GolemQueen];
    this.gender = Gender.Female;
  }
}
