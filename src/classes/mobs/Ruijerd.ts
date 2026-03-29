import { Creature, CreatureInterface } from '../Creature';

export default class Ruijerd extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [7, 16];
    this.love = 20;
    this.hpMax = 1200;
    this.hp = this.hpMax;
    this.name = ['Ruijerd Superdia', 'Ruijerd Superdia'];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_22000`, `enemy_image_22001`];
    this.prefix = false;
    this.lore =
      "Ruijerd Superdia est un Superd, membre d'une race de guerriers d'élite portant une lance cristalline et une marque sur le front, universellement craints et haïs à tort dans son monde d'origine. Stoïque et d'une droiture absolue, il s'est imposé un code d'honneur strict qui lui interdit de mentir ou d'abandonner ceux qu'il a décidé de protéger. Sa réputation de monstre sanguinaire est une injustice historique qui pèse lourdement sur lui, mais il la supporte sans se plaindre. Ici, son apparition en tant qu'adversaire trahit une manipulation extérieure de sa nature profondément loyale.";
    this.gender = 'male';
  }
}
