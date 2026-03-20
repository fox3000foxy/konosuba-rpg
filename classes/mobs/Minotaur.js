const Creature = require("./Creature")
module.exports = class Minotaur extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [2, 8];
        this.love = 100;
        this.hpMax = 70;
        this.hp = this.hpMax;
        this.name = "Minotaur";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_18300`,`enemy_image_18301`];
		this.prefix = true
    }
}