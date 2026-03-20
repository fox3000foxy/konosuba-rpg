const Creature = require("./Creature")
module.exports = class Dragon extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [10, 15];
        this.love = 80;
        this.hpMax = 500;
        this.hp = this.hpMax;
        this.name = "Dragon";
        this.color = rand.choice(["15400", "15401", "15402", "15404"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}