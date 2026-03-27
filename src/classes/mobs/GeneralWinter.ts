import { Creature, CreatureInterface } from "../Creature";

export default class GeneralWinter extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [9, 17];
        this.love = 40;
        this.hpMax = 2300;
        this.hp = this.hpMax;
        this.name = ["General Winter", "Général Winter"];
        this.images = [`enemy_image_10900`];
        this.prefix = true;
        this.lore = "Le Général Winter est un Général du Roi Démon maîtrisant la magie du froid absolu, capable de geler une rivière entière en quelques instants. Stratège méthodique, il préfère épuiser ses adversaires avec des blizzards et des vagues de créatures glaciales plutôt que de s'exposer au combat direct. Sa présence seule abaisse drastiquement la température ambiante, rendant les combats éprouvants même pour les guerriers les mieux équipés. Son point faible reste une certaine rigidité tactique face aux approches complètement imprévisibles.";
        this.gender = "male";
    }
}