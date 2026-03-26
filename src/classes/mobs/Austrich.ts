import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Troll extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 600;
        this.hp = this.hpMax;
        this.name = "Troll";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_${this.color}`];
    }
}