import { Creature, CreatureInterface } from "../Creature";

export default class HansSlime extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [6, 13];
        this.love = 100;
        this.hpMax = 110;
        this.hp = this.hpMax;
        this.name = "Hans";
        this.images = [`enemy_image_14200`];
        this.prefix = true;
    }
}