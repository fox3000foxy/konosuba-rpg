import Creature from "./Creature";
export default class MedusaMan extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [3, 7];
        this.love = 100;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Homme méduse";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_22600`,`enemy_image_22601`];
		this.prefix = true
    }
}