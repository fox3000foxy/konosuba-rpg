import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class GiantOctopus extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 75;
        this.hp = this.hpMax;
        this.name = "Poulpe Géant";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["15100", "15101", "15102"]);
        this.images = [`enemy_image_${this.color}`];
    }
}