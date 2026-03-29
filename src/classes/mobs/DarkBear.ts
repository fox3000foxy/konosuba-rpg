import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class DarkBear extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 12];
    this.love = 20;
    this.hpMax = 500;
    this.hp = this.hpMax;
    this.name = ['Dark Bear', 'Ours Ténébreux'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['11301', '11303', '11304']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = "L'Ours Ténébreux est un ours ordinaire dont le corps a été altéré par une exposition prolongée à l'énergie du Roi Démon, lui conférant une agressivité et une puissance décuplées. Il rôde dans les zones forestières proches des territoires maudits, attaquant tout ce qui croise son chemin. Malgré son intelligence limitée, son instinct de prédateur en fait une menace sérieuse même pour des aventuriers de niveau intermédiaire. Sa fourrure sombre absorbe partiellement les sorts de lumière.";
    this.gender = 'male';
  }
}
