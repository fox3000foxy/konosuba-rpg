import { Random } from "../../utils/Random";
import { Creature } from "./Creature";
export default class Slime extends Creature {
    constructor(rand: Random) {
        super(rand);
        this.attack = [3, 7];
        this.love = 100;
        this.hpMax = 30;
        this.hp = this.hpMax;
        this.name = "Slime";
        this.color = rand.choice(["11700", "17701", "17702", "17704"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}