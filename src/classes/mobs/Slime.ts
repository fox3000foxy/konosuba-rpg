import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Slime extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [3, 7];
        this.love = 100;
        this.hpMax = 30;
        this.hp = this.hpMax;
        this.name = "Slime";
        this.prefix = true;
    }

    pickColor(rng: Random): string {
        this.color = rng.choice(["11700", "17701", "17702", "17704"]);
        this.images = [`enemy_image_${this.color}`];
        return this.color;
    }
}