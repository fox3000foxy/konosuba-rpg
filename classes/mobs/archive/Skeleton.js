const Creature = require("./Creature")
module.exports = class Skeleton extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [1, 7];
        this.love = 4;
        this.hpMax = 10;
        this.hp = this.hpMax;
        this.name = "Squelette";
        this.images = ["skeleton_normal"];
    }
}