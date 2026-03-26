import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Golem extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [4, 10];
        this.love = 100;
        this.hpMax = 90;
        this.hp = this.hpMax;
        this.name = "Golem";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["11201", "11203"]);
        this.images = [`enemy_image_${this.color}`];
    }
}