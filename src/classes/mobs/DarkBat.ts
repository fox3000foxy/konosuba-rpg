import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class DarkBat
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [2, 9];
    this.love = 15;
    this.hpMax = 300;
    this.hp = this.hpMax;
    this.name = ['Dark Bat', 'Chauve-Souris Ténébreuse'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['20401', '20403', '20404', '20406']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "La Chauve-Souris Ténébreuse est une créature nocturne imprégnée d'énergie démoniaque qui renforce ses griffes et son sonar naturel. Elle chasse en meute dans les cavernes et les ruines obscures, harcelant ses proies avec une agilité déconcertante. Sa petite taille la rend difficile à cibler, mais ses points de vie limités la rendent vulnérable à toute attaque de zone. Les aventuriers peu équipés pour les combats dans le noir en font souvent l'amère expérience.";
    this.gender = 'female';
  }
}
