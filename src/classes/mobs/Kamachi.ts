import { Creature } from "../Creature";
import { Random } from "../Random";
export default class Kamachi extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [5, 15];
        this.love = 100;
        this.hpMax = 80;
        this.hp = this.hpMax;
        this.name = "Kamachi Kaiga";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_21200`,`enemy_image_21201`];
		this.prefix = true
    }
}