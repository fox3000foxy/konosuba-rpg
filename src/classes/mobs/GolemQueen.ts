import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class GolemQueen extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [9, 16];
        this.love = 100;
        this.hpMax = 2200;
        this.hp = this.hpMax;
        this.name = "Golem Queen";
        this.prefix = false;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["14300", "14301"]);
        this.images = [`enemy_image_${this.color}`];
    }
}