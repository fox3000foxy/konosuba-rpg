import { Creature } from "../Creature";
import { Random } from "../Random";

export default class Ghoul extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Goule";
        this.color = rand.choice(["15500","15501","15502","15504"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true;
    }
}