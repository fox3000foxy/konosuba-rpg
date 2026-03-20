const Creature = require("./Creature")
module.exports = class AliveTree extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [5, 12];
        this.love = 100;
        this.hpMax = 40;
        this.hp = this.hpMax;
        this.name = "Chaman énervé";
        // this.color = rand.choice(["16707","17201","17202","17204","17205"]);
        this.images = [`enemy_image_22800`,`enemy_image_22801`];
		this.prefix = true
    }
}