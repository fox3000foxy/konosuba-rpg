import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class DarkWolf extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Loup ténébreux";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["15800", "15801", "15803"]);
        this.images = [`enemy_image_${this.color}`];
    }
}