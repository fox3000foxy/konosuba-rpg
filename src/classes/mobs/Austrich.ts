import { Gender } from '../../objects/enums/Gender';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Troll
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [0, 10];
    this.love = 100;
    this.hpMax = 600;
    this.hp = this.hpMax;
    this.name = ['Troll', 'Troll'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice([
      '11000',
      '11001',
      '11002',
      '11003',
      '11004',
      '11005',
      '11006',
    ]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Ce Troll des plaines est une créature massive et stupide, dont la force brute compense largement le manque de stratégie. Il vit en solitaire ou en petits groupes territoriaux et attaque tout ce qui pénètre dans son périmètre. Sa peau épaisse lui confère une résistance naturelle aux coups ordinaires, et sa régénération lente lui permet de tenir longtemps dans un combat. Les aventuriers débutants ont appris à leurs dépens qu'il vaut mieux tourner autour plutôt que de l'affronter de face.";
    this.gender = Gender.Male;
  }
}
