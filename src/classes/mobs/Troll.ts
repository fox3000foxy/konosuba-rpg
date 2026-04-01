import { Gender } from '../../objects/enums/Gender';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Troll
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [5, 13];
    this.love = 100;
    this.hpMax = 800;
    this.hp = this.hpMax;
    this.name = ['Troll', 'Troll'];
    this.prefix = true;
  }

  pickColor(rng: Random): string {
    this.color = rng.choice([
      '11000',
      '11001',
      '11002',
      '11003',
      '11004',
      '11005',
      '11006',
      '11007',
    ]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Troll est une créature brutale et stupide dont la force phénoménale compense largement l'absence de toute finesse tactique. Il vit en groupes dans les zones forestières et montagneuses, attaquant tout ce qui entre dans son périmètre avec une énergie inépuisable. Sa régénération lente lui permet de récupérer de blessures légères entre les combats, décourageant les adversaires qui n'éliminent pas leurs cibles rapidement. Le feu reste la méthode la plus efficace pour neutraliser définitivement ses capacités régénératives.";
    this.gender = Gender.Male;
    return this.color;
  }
}
