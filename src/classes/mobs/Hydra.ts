import { Creature, CreatureInterface } from '../Creature';

export default class Hydra extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 13];
    this.love = 100;
    this.hpMax = 1000;
    this.hp = this.hpMax;
    this.name = ['Hydra', 'Hydre'];
    this.images = [`enemy_image_21800`, `enemy_image_21801`];
    this.prefix = true;
    this.lore = "L'Hydre est un serpent à plusieurs têtes dont chacune peut attaquer indépendamment, multipliant les angles d'attaque simultanés. Tranchée, une tête repousse en quelques heures si la plaie n'est pas cautérisée immédiatement par le feu ou la magie. Elle vit dans les marécages et les zones humides, embusquée sous l'eau en attente de proies imprudentes. Les aventuriers expérimentés savent qu'ils doivent coordonner leurs attaques pour éviter de créer involontairement plus de têtes qu'ils n'en ont détruit.";
    this.gender = 'female';
  }
}
