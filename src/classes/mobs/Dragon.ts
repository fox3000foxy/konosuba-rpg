import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class Dragon extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [12, 20];
        this.love = 80;
        this.hpMax = 500;
        this.hp = this.hpMax;
        this.name = "Dragon";
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["15400", "15401", "15402", "15404"]);
        this.images = [`enemy_image_${this.color}`];
    }
}