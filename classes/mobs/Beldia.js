const Creature = require("./Creature")
module.exports = class Beldia extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Beldia";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_10300`];
		this.prefix = false
    }
}