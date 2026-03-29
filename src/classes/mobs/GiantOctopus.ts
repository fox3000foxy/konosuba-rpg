import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class GiantOctopus extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [5, 12];
    this.love = 100;
    this.hpMax = 850;
    this.hp = this.hpMax;
    this.name = ['Giant Octopus', 'Poulpe Géant'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['15100', '15101', '15102']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = "Le Poulpe Géant est un monstre des profondeurs dont les tentacules peuvent s'étendre sur plusieurs mètres pour saisir et broyer ses victimes. Il s'aventure parfois dans les zones côtières ou remonte les rivières importantes à la recherche de nourriture. Son encre magique peut aveugler temporairement les adversaires et perturber les sortilèges de détection. Les pêcheurs de la région le considèrent comme le fléau le plus dangereux des eaux du royaume.";
    this.gender = 'male';
  }
}
