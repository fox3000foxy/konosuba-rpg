import { Creature, CreatureInterface } from "../Creature";

export default class Kamachi extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [7, 15];
        this.love = 100;
        this.hpMax = 950;
        this.hp = this.hpMax;
        this.name = ["Kamachi Kaiga", "Kamachi Kaiga"];
        this.images = [`enemy_image_21200`,`enemy_image_21201`];
        this.prefix = true;
        this.lore = "Kamachi Kaiga est un combattant d'élite qui sert les forces du Roi Démon, réputé pour une maîtrise des armes blanches qui défie les aventuriers les plus aguerris. Discipliné et méthodique, il observe ses adversaires avant de frapper, cherchant la faille parfaite dans leur défense. Son sens de l'honneur guerrier le distingue des sbires ordinaires, et il refuse d'attaquer par derrière ou de s'en prendre aux blessés. Cette éthique stricte est parfois exploitée par des adversaires moins scrupuleux pour prendre l'avantage.";
        this.gender = "male";
    }
}