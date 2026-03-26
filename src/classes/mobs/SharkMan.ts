import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class SharkMan extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [6, 14];
        this.love = 100;
        this.hpMax = 1000;
        this.hp = this.hpMax;
        this.name = "Homme-Requin";
        this.prefix = true;
    }

    pickColor(rng: Random): string {
        this.color = rng.choice(["15200", "15201"]);
        this.images = [`enemy_image_${this.color}`];
        return this.color;
    }
}