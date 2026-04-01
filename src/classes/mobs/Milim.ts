import { Gender } from '../../objects/enums/Gender';
import { Creature, CreatureInterface } from '../Creature';

export default class Milim extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [10, 20];
    this.love = 20;
    this.hpMax = 2000;
    this.hp = this.hpMax;
    this.name = ['Milim Nava', 'Milim Nava'];
    this.images = [
      `enemy_image_22700`,
      `enemy_image_22701`,
      `enemy_image_22702`,
    ];
    this.prefix = false;
    this.lore =
      "Milim Nava est une Seigneur Démon d'une puissance cataclysmique, considérée comme l'une des êtres les plus forts de son univers d'origine. Enfantine dans son comportement, elle alterne entre crises capricieuses et explosions de puissance qui peuvent raser des montagnes entières. Son amitié est aussi précieuse que dangereuse : la contrarier peut déclencher des catastrophes à l'échelle régionale. Dans ce monde, sa présence en tant qu'adversaire est un signal clair que la situation a totalement dégénéré.";
    this.gender = Gender.Female;
  }
}
