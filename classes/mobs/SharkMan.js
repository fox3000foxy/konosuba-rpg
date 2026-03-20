const Creature = require("./Creature")
module.exports = class SharkMan extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Homme-Requin";
        this.color = rand.choice(["15200", "15201"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}