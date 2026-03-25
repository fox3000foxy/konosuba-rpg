import { Random } from "../Random";
import { Creature } from "./Creature";

export default class GeneralWinter extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [10, 15];
        this.love = 40;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Général Winter";
        this.images = [`enemy_image_10900`];
		this.prefix = true;
    }
}