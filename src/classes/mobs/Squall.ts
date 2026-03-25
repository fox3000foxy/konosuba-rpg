import { Random } from "../../utils/Random";
import { Creature } from "./Creature";
export default class Squall extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [3, 8];
        this.love = 50;
        this.hpMax = 50;
        this.hp = this.hpMax;
        this.name = "Squall";
        // this.color = rand.choice(["16700","16701","16702","16704"]);
        this.images = [`enemy_image_16801`,`enemy_image_16802`];
		this.prefix = false
    }
}