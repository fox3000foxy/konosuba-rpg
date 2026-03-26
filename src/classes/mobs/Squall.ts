import { Creature, CreatureInterface } from "../Creature";

export default class Squall extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [5, 11];
        this.love = 50;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Squall";
        // this.color = rand.choice(["16700","16701","16702","16704"]);
        this.images = [`enemy_image_16801`,`enemy_image_16802`];
		this.prefix = false
    }
}