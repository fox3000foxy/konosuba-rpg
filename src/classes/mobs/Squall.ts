import { Gender } from '../../objects/enums/Gender';
import { Creature, CreatureInterface } from '../Creature';

export default class Squall extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [5, 11];
    this.love = 50;
    this.hpMax = 600;
    this.hp = this.hpMax;
    this.name = ['Squall', 'Squall'];
    // this.color = rand.choice(["16700","16701","16702","16704"]);
    this.images = [`enemy_image_16801`, `enemy_image_16802`];
    this.prefix = false;
    this.lore =
      "Squall est un esprit élémentaire du vent doté d'une conscience propre, capable de générer des bourrasques tranchantes qui peuvent lacérer les armures légères. Il se manifeste lors des tempêtes ou dans les zones de forte activité magique, attiré par les concentrations d'énergie élémentaire. Capricieux et imprévisible, il change de cible au fil de ses humeurs sans réelle logique tactique apparente. Les mages spécialisés en magie terrestre peinent à l'affecter, mais les sorts de foudre le neutralisent rapidement.";
    this.gender = Gender.Male;
  }
}
