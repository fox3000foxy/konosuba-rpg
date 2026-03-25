import { Random } from "../Random";
import { Creature } from "./Creature";

export default class Destroyer extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [5, 15];
        this.love = 100;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Destroyer";
        this.color = rand.choice(["19300", "19302"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true;
    }
}