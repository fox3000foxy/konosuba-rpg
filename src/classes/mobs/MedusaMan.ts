import { Creature, CreatureInterface } from '../Creature';

export default class MedusaMan extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [4, 10];
    this.love = 100;
    this.hpMax = 650;
    this.hp = this.hpMax;
    this.name = ['Medusa Man', 'Homme méduse'];
    this.images = [`enemy_image_22600`, `enemy_image_22601`];
    this.prefix = true;
    this.lore = "L'Homme Méduse est une créature mi-humaine mi-méduse capable de pétrifier ses adversaires d'un simple regard prolongé. Il vit dans les zones rocailleuses et les cavernes, entouré de statues de pierre qui sont en réalité ses victimes passées. Sa biologie hybride lui confère une résistance aux poisons et une agilité étonnante malgré son apparence disgracieuse. Les aventuriers l'affrontent systématiquement les yeux baissés ou protégés d'un miroir, rendant le combat particulièrement périlleux.";
    this.gender = 'male';
  }
}
