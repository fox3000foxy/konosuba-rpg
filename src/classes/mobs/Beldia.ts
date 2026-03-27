import { Creature, CreatureInterface } from "../Creature";

export default class Beldia extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [8, 16];
        this.love = 100;
        this.hpMax = 2500;
        this.hp = this.hpMax;
        this.name = ["Beldia", "Beldia"];
        this.images = [`enemy_image_10300`];
		this.prefix = false;
        this.lore = "Beldia est un Général du Roi Démon, un chevalier dullahan dont la tête tranchée flotte librement à côté de son corps armé. Il commande une armée de morts-vivants dans la région d'Axel, terrorisant les villages environnants depuis des années. Arrogant et implacable, il méprise profondément les aventuriers de bas niveau — une attitude qui lui a valu d'humiliantes défaites face à la bande de Kazuma. Sa grande puissance de combat ne l'a pas protégé des tactiques les plus absurdes et inattendues.";
        this.gender = "male";
    }
}