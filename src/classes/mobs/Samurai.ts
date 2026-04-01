import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature, CreatureInterface } from '../Creature';
import { EnglishLore } from '../../objects/enums/EnglishLore';

export default class Samurai extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [5, 14];
    this.love = 100;
    this.hpMax = 750;
    this.hp = this.hpMax;
    this.name = ['Samurai', 'Samuraï'];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_10901`];
    this.prefix = true;
    this.lore = [FrenchLores.Creature_Samurai, EnglishLore.Creature_Samurai];
    this.gender = Gender.Male;
  }
}