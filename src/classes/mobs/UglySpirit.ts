import { Creature, CreatureInterface } from "../Creature";

export default class UglySpirit extends Creature implements CreatureInterface {
  constructor() {
    super();
    this.attack = [3, 12];
    this.love = 100;
    this.hpMax = 550;
    this.hp = this.hpMax;
    this.name = ["Ugly Spirit", "Esprit hideux"];
    // this.color = rand.choice([<"11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
    this.images = [`enemy_image_21500`, `enemy_image_21501`];
    this.prefix = true;
    this.lore =
      "L'Esprit Hideux est une entité spectrale issue des âmes les plus corrompues et rancunières, dont l'apparence repoussante reflète la noirceur intérieure de ce qu'il était autrefois. Il hante les ruines et les lieux de tragédies anciennes, drainant l'énergie vitale des vivants qui s'aventurent trop près. Ses attaques traversent les armures physiques, rendant les défenses conventionnelles totalement inefficaces contre lui. La magie sacrée d'Aqua est particulièrement redoutable contre cette créature, ce qui constitue l'une des rares situations où ses pouvoirs divins s'avèrent vraiment utiles.";
    this.gender = "male";
  }
}
