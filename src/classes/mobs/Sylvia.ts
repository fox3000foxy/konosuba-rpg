import { Gender } from '../../objects/enums/Gender';
import { FrenchLores } from '../../objects/enums/FrenchLores';
import { Creature } from '../Creature';
import { EnglishLore } from '../../objects/enums/EnglishLore';
export default class Sylvia extends Creature {
  constructor() {
    super();
    this.attack = [8, 15];
    this.love = 50;
    this.hpMax = 1600;
    this.hp = this.hpMax;
    this.name = ['Sylvia', 'Sylvia'];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_14500`];
    this.prefix = false;
  }

  dealAttack(dmg: number) {
    this.hp -= dmg;
    if (this.hp <= 20) this.images = [`enemy_image_14501`];
    this.lore = [FrenchLores.Creature_Sylvia, EnglishLore.Creature_Sylvia];
    this.gender = Gender.Female;
  }
}