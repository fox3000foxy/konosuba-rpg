import { Gender } from '../../objects/enums/Gender';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Golem
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [4, 10];
    this.love = 100;
    this.hpMax = 900;
    this.hp = this.hpMax;
    this.name = ['Golem', 'Golem'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['11201', '11203']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Golem est une construction magique animée par un cristal d'énergie niché dans sa poitrine, créé pour garder des lieux ou des trésors anciens. Insensible à la douleur et aux émotions, il accomplit sa mission de garde avec une persistance mécanique absolue. Ses poings de pierre peuvent briser les boucliers les plus solides, mais sa lenteur le rend vulnérable aux combattants agiles. Détruire le cristal au centre de sa masse est le seul moyen sûr de l'arrêter définitivement.";
    this.gender = Gender.Neutral;
  }
}
