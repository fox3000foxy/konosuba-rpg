import { Creature, CreatureInterface } from "../Creature";

export default class GeneralWinter extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [9, 17];
        this.love = 40;
        this.hpMax = 2300;
        this.hp = this.hpMax;
        this.name = "Général Winter";
        this.images = [`enemy_image_10900`];
		this.prefix = true;
    }
}