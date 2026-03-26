import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Quomodo extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [0, 10];
        this.love = 25;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Komodo";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["15900", "15904"]);
        this.images = [`enemy_image_${this.color}`];
    }
}