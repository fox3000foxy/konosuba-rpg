import { Creature } from "../Creature";

export default class AngryShaman extends Creature implements Creature {
    constructor() {
        super();
        this.attack = [5, 12];
        this.love = 100;
        this.hpMax = 50;
        this.hp = this.hpMax;
        this.name = "Chaman énervé";
        this.images = [`enemy_image_22800`,`enemy_image_22801`];
		this.prefix = true;
    }
}