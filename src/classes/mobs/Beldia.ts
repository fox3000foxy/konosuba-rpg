import { Creature, CreatureInterface } from "../Creature";

export default class Beldia extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [8, 16];
        this.love = 100;
        this.hpMax = 250;
        this.hp = this.hpMax;
        this.name = "Beldia";
        this.images = [`enemy_image_10300`];
		this.prefix = false;
    }
}