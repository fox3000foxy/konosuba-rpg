const Creature = require("./Creature")
module.exports = class AliveTree extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [3, 10];
        this.love = 100;
        this.hpMax = 40;
        this.hp = this.hpMax;
        this.name = "Arbre vivant";
        this.color = rand.choice(["16707","17201","17202","17204","17205"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}