import { Gender } from '../../objects/enums/Gender';
import { Creature, CreatureInterface } from '../Creature';

export default class KingTroll extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [7, 15];
    this.love = 100;
    this.hpMax = 1500;
    this.hp = this.hpMax;
    this.name = ['King Troll', 'Roi Troll'];
    this.images = [`enemy_image_10001`, `enemy_image_10004`];
    this.prefix = true;
    this.lore =
      "Le Roi Troll est le chef incontesté d'une tribu de trolls, imposant sa domination par la force brute et une taille deux fois supérieure à celle de ses congénères. Il possède une intelligence rudimentaire lui permettant de diriger des raids organisés sur les villages et les caravanes marchandes. Sa régénération est bien plus rapide que celle des trolls ordinaires, rendant les combats prolongés à son avantage. Les guildes d'aventuriers offrent une prime substantielle pour toute preuve de sa mise hors d'état de nuire.";
    this.gender = Gender.Male;
  }
}
