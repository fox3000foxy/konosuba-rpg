import { Random } from "../Random";
import { Creature } from "./Creature";
export default class MaidBot extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 70;
        this.hp = this.hpMax;
        this.name = "Robot Maid";
        this.color = rand.choice(["19400","19401","19403","19404"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}