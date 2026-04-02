import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class SharkMan extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [6, 14];
    this.love = 100;
    this.hpMax = 1000;
    this.hp = this.hpMax;
    this.name = ['Shark Man', 'Homme-Requin'];
    this.prefix = true;
  }

  pickColor(rng: Random): string {
    this.color = rng.choice(['15200', '15201']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = [FrenchLores.Creature_SharkMan, EnglishLore.Creature_SharkMan];
    this.gender = Gender.Male;
    return this.color;
  }
}
