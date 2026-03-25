import { Creature } from "../Creature";
import { Random } from "../Random";
export default class Hydra extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [3, 10];
        this.love = 100;
        this.hpMax = 80;
        this.hp = this.hpMax;
        this.name = "Hydre";
        // this.color = rand.choice(["15500","15501","15502","15504"]);
        this.images = [`enemy_image_21800`,`enemy_image_21801`];
		this.prefix = true
    }
}