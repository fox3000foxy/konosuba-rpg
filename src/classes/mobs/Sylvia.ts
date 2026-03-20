import { Creature } from "./Creature";
export default class Sylvia extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [10, 15];
        this.love = 50;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Sylvia";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_14500`];
		this.prefix = false
    }
	
	dealAttack(dmg: number) {
        this.hp -= dmg;
		if(this.hp <= 20)
			this.images = [`enemy_image_14501`];
    }
}