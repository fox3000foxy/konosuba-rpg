import { Gender } from '../../objects/enums/Gender';
import { Creature, CreatureInterface } from '../Creature';

export default class Samurai extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [5, 14];
    this.love = 100;
    this.hpMax = 750;
    this.hp = this.hpMax;
    this.name = ['Samurai', 'Samuraï'];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_10901`];
    this.prefix = true;
    this.lore =
      "Le Samouraï est un guerrier des contrées orientales au service des forces du Roi Démon, maîtrisant un style de combat à la lame rapide et précise inconnu dans les royaumes occidentaux. Sa discipline martiale lui confère une vitesse d'attaque supérieure à celle de la plupart des chevaliers locaux, déstabilisant les combattants habitués aux styles classiques. Il suit un code d'honneur personnel qui, parfois, entre en contradiction avec les ordres reçus. Les aventuriers qui ont survécu à un duel contre lui rapportent que sa technique est aussi élégante qu'implacable.";
    this.gender = Gender.Male;
  }
}
