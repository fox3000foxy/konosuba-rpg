import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class MaidBot extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 70;
        this.hp = this.hpMax;
        this.name = "Robot Maid";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["19400", "19401", "19403", "19404"]);
        this.images = [`enemy_image_${this.color}`];
    }
}