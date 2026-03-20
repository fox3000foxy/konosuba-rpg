const Creature = require("./Creature")
module.exports = class GiantEarthworm extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 75;
        this.hp = this.hpMax;
        this.name = "Ver de terre Géant";
        this.color = rand.choice(["11500", "11501", "11503"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}