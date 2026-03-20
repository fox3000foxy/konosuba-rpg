const Creature = require("./Creature")
module.exports = class Golem extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [0, 8];
        this.love = 100;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Golem";
        this.color = rand.choice(["11201", "11203"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}