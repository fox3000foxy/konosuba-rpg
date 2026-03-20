const Creature = require("./Creature")
module.exports = class Dog extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [1, 4];
        this.love = 2;
        this.hpMax = 10;
        this.hp = this.hpMax;
        this.name = "Chien";
        this.images = ["dog_normal"];
    }

    giveHug() {
        super.giveHug();
        this.images = ["dog_bark"];
    }

    dealAttack(dmg) {
        super.dealAttack(dmg);
        this.images = ["dog_normal"];
    }
}