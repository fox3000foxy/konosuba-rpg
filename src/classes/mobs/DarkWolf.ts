import { Creature } from "../Creature";
import { Random } from "../Random";


export default class DarkWolf extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Loup ténébreux";
        this.color = rand.choice(["15800", "15801", "15803"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true;
    }
}