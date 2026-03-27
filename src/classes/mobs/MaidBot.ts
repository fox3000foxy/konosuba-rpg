import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class MaidBot extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [5, 12];
        this.love = 100;
        this.hpMax = 800;
        this.hp = this.hpMax;
        this.name = ["Maid Bot", "Robot Maid"];
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["19400", "19401", "19403", "19404"]);
        this.images = [`enemy_image_${this.color}`];
        this.lore = "Le Robot Maid est une automate de combat créée par le Roi Démon sous apparence de domestique serviable, dissimulant des armes intégrées derrière une façade inoffensive. Programmé pour infiltrer les résidences nobles et les bases d'aventuriers, il exécute ses cibles avec une précision clinique. Son enveloppe extérieure imite parfaitement les expressions humaines, rendant sa détection particulièrement difficile avant qu'il ne soit trop tard. Les guildes de renseignement ont mis en place des protocoles d'identification pour repérer ces infiltrateurs mécaniques.";
        this.gender = "female";
    }
}