import { Creature, CreatureInterface } from '../Creature';

export default class Vanir extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 14];
    this.love = 30;
    this.hpMax = 1300;
    this.hp = this.hpMax;
    this.name = ['Vanir', 'Vanir'];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_17800`];
    this.prefix = false;
    this.lore =
      "Vanir est un Général du Roi Démon, un démon du masque capable de lire l'âme de ses adversaires et d'anticiper tous leurs mouvements avant même qu'ils ne les exécutent. Ironique et raffiné, il savoure les émotions négatives comme d'autres savourent un bon repas, se nourrissant littéralement de la détresse et de la honte des autres. Malgré sa nature démoniaque, il possède un sens de l'honneur commercial étrange qui l'a conduit à s'établir comme marchand après sa défaite. Son sens de l'humour masochiste — il apprécie d'être insulté — déroute systématiquement ses interlocuteurs.";
    this.gender = 'male';
  }
}
