import { Random } from "../../utils/Random";
import { Creature } from "./Creature";
export default class GolemQueen extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [10, 15];
        this.love = 100;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Golem Queen";
        this.color = rand.choice(["14300", "14301"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = false
    }
}