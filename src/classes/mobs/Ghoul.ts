import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Ghoul extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [3, 10];
        this.love = 100;
        this.hpMax = 350;
        this.hp = this.hpMax;
        this.name = "Goule";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["15500", "15501", "15502", "15504"]);
        this.images = [`enemy_image_${this.color}`];
    }
}