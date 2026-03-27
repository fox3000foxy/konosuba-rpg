import { Creature, CreatureInterface } from "../Creature";

export default class Minotaur extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [6, 14];
    this.love = 100;
    this.hpMax = 900;
    this.hp = this.hpMax;
    this.name = ["Minotaur", "Minotaure"];
    this.images = [`enemy_image_18300`, `enemy_image_18301`];
    this.prefix = true;
    this.lore =
      "Le Minotaure est un colosse mi-homme mi-taureau dont la force physique dépasse celle de la plupart des monstres de son rang. Il vit dans les labyrinthes et les donjons profonds, gardant jalousement le cœur de son territoire contre tout intrus. Ses charges dévastatrices peuvent traverser des formations de boucliers entières, et ses cornes percutent avec la force d'un bélier de siège. Seule une grande agilité ou une attaque à distance permet d'éviter de se retrouver directement sur sa trajectoire.";
    this.gender = "male";
  }
}
