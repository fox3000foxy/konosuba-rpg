import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class DarkWolf
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [5, 13];
    this.love = 100;
    this.hpMax = 950;
    this.hp = this.hpMax;
    this.name = ["Dark Wolf", "Loup ténébreux"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["15800", "15801", "15803"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Loup Ténébreux est un prédateur des plaines et forêts corrompues, dont le pelage sombre absorbe la lumière et le rend difficile à repérer la nuit. Intelligent pour un monstre de son rang, il coordonne ses attaques en meute avec une efficacité redoutable. Sa vitesse et ses crocs imprégnés d'énergie démoniaque lui permettent de traverser certaines armures légères. Les bergers de la région d'Axel le redoutent plus que tout autre monstre des alentours.";
    this.gender = "male";
  }
}
