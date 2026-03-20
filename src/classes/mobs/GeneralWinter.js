const Creature = require("./Creature")
module.exports = class GeneralWinter extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [10, 15];
        this.love = 40;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Général Winter";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_10900`];
		this.prefix = true
    }
}