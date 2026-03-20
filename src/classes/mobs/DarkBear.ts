import { Random } from "../../utils/Random";
import { Creature } from "./Creature";

export default class DarkBear extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [2, 10];
        this.love = 20;
        this.hpMax = 30;
        this.hp = this.hpMax;
        this.name = "Ours Ténébreuse";
        this.color = rand.choice(["11301","11303","11304"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true;
    }
}