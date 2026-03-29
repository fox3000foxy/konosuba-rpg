import { Creature } from '../Creature';
export default class Sylvia extends Creature {
  constructor() {
    super();
    this.attack = [8, 15];
    this.love = 50;
    this.hpMax = 1600;
    this.hp = this.hpMax;
    this.name = ['Sylvia', 'Sylvia'];
    // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_14500`];
    this.prefix = false;
  }

  dealAttack(dmg: number) {
    this.hp -= dmg;
    if (this.hp <= 20) this.images = [`enemy_image_14501`];
    this.lore = "Sylvia est un Général du Roi Démon d'une beauté frappante cachant une nature hybride extrêmement dangereuse, capable d'absorber d'autres êtres pour intégrer leurs pouvoirs. Séductrice et cruelle, elle manipule ses adversaires en jouant sur leur confusion avant de frapper au moment le plus inattendu. Sa capacité d'absorption en fait une menace polymorphe dont les aptitudes évoluent au cours du combat, rendant toute préparation préalable partiellement obsolète. Sa défaite a nécessité une des stratégies les plus désespérées et improbables que Kazuma ait jamais conçues.";
    this.gender = 'female';
  }
}
