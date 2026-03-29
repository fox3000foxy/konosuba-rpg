import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class GolemQueen
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [9, 16];
    this.love = 100;
    this.hpMax = 2200;
    this.hp = this.hpMax;
    this.name = ['Golem Queen', 'Reine Golem'];
    this.prefix = false;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['14300', '14301']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "La Golem Queen est une version colossale et évoluée du golem ordinaire, dotée d'une forme d'intelligence primaire lui permettant de coordonner d'autres golems. Elle a été créée comme gardienne suprême d'un site antique d'une importance capitale pour le Roi Démon. Ses poings génèrent des ondes de choc à l'impact et elle peut régénérer partiellement son enveloppe de pierre au combat. La vaincre nécessite de neutraliser simultanément plusieurs points d'énergie répartis sur son corps.";
    this.gender = 'female';
  }
}
