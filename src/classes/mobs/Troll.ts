import { Random } from "../Random";
import { Creature } from "./Creature";
export default class Troll extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Troll";
        this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006", "11007"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}