import { Random } from "../Random";
import { Creature } from "./Creature";
export default class Ruijerd extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 20;
        this.hpMax = 80;
        this.hp = this.hpMax;
        this.name = "Ruijerd Superdia";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_22000`,`enemy_image_22001`];
		this.prefix = false
    }
}