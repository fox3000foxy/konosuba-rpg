import { Random } from "../Random";
import { Creature } from "./Creature";
export default class Samurai extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Samuraï";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_10901`];
		this.prefix = true
    }
}