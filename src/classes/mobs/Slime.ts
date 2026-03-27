import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Slime extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [2, 8];
        this.love = 100;
        this.hpMax = 400;
        this.hp = this.hpMax;
        this.name = ["Slime", "Slime"];
        this.prefix = true;
    }

    pickColor(rng: Random): string {
        this.color = rng.choice(["17700", "17701", "17702", "17704"]);
        this.images = [`enemy_image_${this.color}`];
        this.lore = "Le Slime est une masse gélatineuse dont la forme simple dissimule une résistance aux attaques physiques et une capacité à corroder progressivement tout ce qu'il englobe. Il se retrouve dans les donjons et les zones humides, attirant les aventuriers peu méfiants par son apparence inoffensive. Sa faiblesse principale réside dans les attaques de feu ou de froid intense, qui modifient sa structure interne et réduisent sa cohésion. Dans le monde de KonoSuba, même cette créature ordinaire peut s'avérer problématique pour une équipe aussi chaotique que celle de Kazuma.";
        this.gender = "neutral";
        return this.color;
    }
}