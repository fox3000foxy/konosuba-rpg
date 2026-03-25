import { Random } from "../Random";
import { Creature } from "./Creature";

export default class Beldia extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Beldia";
        this.images = [`enemy_image_10300`];
		this.prefix = false;
    }
}