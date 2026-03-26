import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class LoveBunny extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [0, 10];
        this.love = 20;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Love Bunny";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["16001", "16002", "16003"]);
        this.images = [`enemy_image_${this.color}`];
    }
}