import { Creature } from "./Creature";
export default class KingTroll extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 120;
        this.hp = this.hpMax;
        this.name = "Roi Troll";
        // this.color = rand.choice(["10000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_10001`,`enemy_image_10004`];
		this.prefix = true
    }
}