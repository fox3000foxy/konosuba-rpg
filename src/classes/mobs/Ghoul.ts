import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Ghoul
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [3, 10];
    this.love = 100;
    this.hpMax = 350;
    this.hp = this.hpMax;
    this.name = ["Ghoul", "Goule"];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(["15500", "15501", "15502", "15504"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "La Goule est un mort-vivant affamé animé par une faim insatiable de chair vivante, dont le corps en décomposition dégage une aura de peur. Elle rôde près des cimetières et des ruines, attaquant les voyageurs isolés avec une férocité bestiale. Ses griffes et ses dents peuvent transmettre une infection qui ralentit la guérison magique si elle n'est pas traitée rapidement. Bien que facilement vaincue par la magie sacrée, elle reste une menace sérieuse en nombre.";
    this.gender = "female";
  }
}
