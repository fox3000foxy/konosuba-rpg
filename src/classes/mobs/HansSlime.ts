import { Creature, CreatureInterface } from "../Creature";

export default class HansSlime extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Hans";
        this.images = [`enemy_image_14200`];
        this.prefix = true;
    }
}