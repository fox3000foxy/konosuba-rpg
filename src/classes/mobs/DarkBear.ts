import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class DarkBear extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [2, 10];
        this.love = 20;
        this.hpMax = 30;
        this.hp = this.hpMax;
        this.name = "Ours Ténébreuse";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["11301", "11303", "11304"]);
        this.images = [`enemy_image_${this.color}`];
    }
}