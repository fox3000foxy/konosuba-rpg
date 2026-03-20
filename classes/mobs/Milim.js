const Creature = require("./Creature")
module.exports = class Milim extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [4, 6];
        this.love = 20;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Milim Nava";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_22700`,`enemy_image_22701`,`enemy_image_22702`];
		this.prefix = false
    }
}