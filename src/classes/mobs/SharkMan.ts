import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class SharkMan extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 100;
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