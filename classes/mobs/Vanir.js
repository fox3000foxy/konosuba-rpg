const Creature = require("./Creature")
module.exports = class Troll extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [5, 10];
        this.love = 30;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Vanir";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_17800`];
		this.prefix = false
    }
}