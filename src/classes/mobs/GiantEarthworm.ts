import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class GiantEarthworm extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 75;
        this.hp = this.hpMax;
        this.name = "Ver de terre Géant";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["11500", "11501", "11503"]);
        this.images = [`enemy_image_${this.color}`];
    }
}