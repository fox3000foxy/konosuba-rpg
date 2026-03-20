const Creature = require("./Creature")
module.exports = class DarkBat extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [2, 10];
        this.love = 15;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Chauve-Souris Ténébreuse";
        this.color = rand.choice(["20401","20403","20404","20406"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}