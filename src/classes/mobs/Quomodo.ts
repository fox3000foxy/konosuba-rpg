import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Quomodo
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [5, 13];
    this.love = 25;
    this.hpMax = 900;
    this.hp = this.hpMax;
    this.name = ['Komodo', 'Komodo'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['15900', '15904']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      'Le Komodo est un gigantesque lézard prédateur dont la mâchoire peut broyer une armure de métal ordinaire et dont la salive est chargée de bactéries paralysantes. Il chasse seul dans les plaines arides et les zones rocailleuses, embusqué avec une patience remarquable avant de foncer sur sa proie. Sa peau écailleuse offre une résistance naturelle aux armes tranchantes, forçant ses adversaires à viser les articulations ou à utiliser des armes contondantes. Les guérisseurs redoutent ses morsures, car les infections qui en résultent résistent aux potions ordinaires.';
    this.gender = 'male';
  }
}
