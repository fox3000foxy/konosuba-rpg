import { Creature, CreatureInterface } from "../Creature";

export default class Milim extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [10, 20];
        this.love = 20;
        this.hpMax = 2000;
        this.hp = this.hpMax;
        this.name = "Milim Nava";
        this.images = [`enemy_image_22700`,`enemy_image_22701`,`enemy_image_22702`];
		this.prefix = false
    }
}