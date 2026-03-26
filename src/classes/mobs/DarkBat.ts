import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class DarkBat extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [2, 10];
        this.love = 15;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Chauve-Souris Ténébreuse";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["20401","20403","20404","20406"]);
        this.images = [`enemy_image_${this.color}`];
    }
}