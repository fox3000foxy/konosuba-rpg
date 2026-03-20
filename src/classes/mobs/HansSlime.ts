import { Creature } from "./Creature";
export default class HansSlime extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Hans";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_14200`];
		this.prefix = true
    }
}