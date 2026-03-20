const Creature = require("./Creature")
module.exports = class DarkBat extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [0, 10];
        this.love = 15;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Rat Ténébreux";
        this.color = rand.choice(["17500","17502"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}