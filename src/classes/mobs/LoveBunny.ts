import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class LoveBunny
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [1, 6];
    this.love = 20;
    this.hpMax = 200;
    this.hp = this.hpMax;
    this.name = ['Love Bunny', 'Love Bunny'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['16001', '16002', '16003']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Love Bunny est une créature mignonne et trompeuse dont l'apparence de lapin inoffensif dissimule une nature agressive et possessive. Il émet des phéromones magiques qui attirent irrésistiblement les adventuriers imprudents dans son territoire pour s'en prendre à eux. Malgré sa faible puissance d'attaque, il est capable de mordre avec une férocité surprenante et de griffer en cas de coin acculé. Les novices d'Axel ont souvent eu la mauvaise surprise de le sous-estimer en raison de son apparence attendrissante.";
    this.gender = 'neutral';
  }
}
