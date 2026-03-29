import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Destroyer extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [10, 18];
    this.love = 100;
    this.hpMax = 3500;
    this.hp = this.hpMax;
    this.name = ['Destroyer', 'Destroyer'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['19300', '19302']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = "Le Destroyer est une gigantesque arme de siège automatisée créée par le Roi Démon, ressemblant à une forteresse mobile sur pattes mécaniques. Il a semé la terreur dans plusieurs régions, son passage laissant derrière lui des villages rasés et des routes détruites. Ses attaques à longue portée et son armure colossale le rendent quasiment inattaquable par des méthodes conventionnelles. L'équipe de Kazuma a dû faire preuve d'une ingéniosité désespérée pour le vaincre.";
    this.gender = 'neutral';
  }
}
