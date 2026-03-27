import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Wizard
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [4, 14];
    this.love = 100;
    this.hpMax = 450;
    this.hp = this.hpMax;
    this.name = ["Wizard", "Sorcier"];
    this.prefix = true;
  }

  pickColor(rng: Random): string {
    this.color = rng.choice(["16100", "16101", "16102", "16103", "16104"]);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Sorcier est un mage corrompu ayant vendu ses services aux forces du Roi Démon en échange d'une puissance magique accrue, au prix de sa liberté morale. Il maîtrise une variété de sorts offensifs allant des projectiles de feu aux malédictions d'affaiblissement, adaptant son arsenal à la situation. Son intelligence supérieure à celle des monstres ordinaires en fait un adversaire capable de contre-stratégies efficaces si on lui en laisse le temps. Les classes de soutien le ciblent en priorité, car laisser un sorcier agir librement peut changer le cours d'un combat entier.";
    this.gender = "male";
    return this.color;
  }
}
