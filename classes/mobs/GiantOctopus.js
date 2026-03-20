const Creature = require("./Creature")
module.exports = class GiantOctopus extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 75;
        this.hp = this.hpMax;
        this.name = "Poulpe Géant";
        this.color = rand.choice(["15100", "15101", "15102"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}