import { Random } from "../../utils/Random";
import { Creature } from "./Creature";

export default class DarkRat extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 15;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Rat Ténébreux";
        this.color = rand.choice(["17500","17502"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true;
    }
}