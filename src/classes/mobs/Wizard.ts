import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Wizard extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 50;
        this.hp = this.hpMax;
        this.name = "Sorcier";
        this.prefix = true;
    }

    pickColor(rng: Random): string {
        this.color = rng.choice(["16100", "16101", "16102", "16103", "16104"]);
        this.images = [`enemy_image_${this.color}`];
        return this.color;
    }
}