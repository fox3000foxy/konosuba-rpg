import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Knight extends GenericCreature implements GenericCreatureInterface {
  constructor() {
    super();
    this.attack = [4, 12];
    this.love = 30;
    this.hpMax = 700;
    this.hp = this.hpMax;
    this.name = ['Cursed Knight', 'Chevalier maudit'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['14800', '14802', '14803']);
    this.images = [`enemy_image_${this.color}`];
    this.lore = "Le Chevalier Maudit est un guerrier autrefois honorable dont l'âme a été corrompue par une malédiction démoniaque, le condamnant à servir éternellement les forces des ténèbres. Il conserve ses réflexes de combat affûtés et son armure solide, mais toute volonté propre a disparu depuis longtemps. Certains racontent qu'au fond de ses yeux vides brillent encore des éclats de sa conscience d'antan, suppliant qu'on le libère. Seule une magie sacrée puissante peut briser la malédiction et lui rendre la paix.";
    this.gender = 'male';
  }
}
