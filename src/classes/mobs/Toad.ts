import { Random } from "../Random";
import { Creature } from "./Creature";
export default class Toad extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [2, 6];
        this.love = 50;
        this.hpMax = 40;
        this.hp = this.hpMax;
        this.name = "Crapaud";
        this.color = rand.choice(["16700","16701","16702","16704"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}