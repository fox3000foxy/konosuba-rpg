const Creature = require("./Creature")
module.exports = class Snake extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [2, 4];
        this.love = 4;
        this.hpMax = 6;
        this.hp = this.hpMax;
        this.name = "Serpent";
        this.color = rand.choice(["magenta", "green", "yellow"]);
        this.images = [`snake_${this.color}`];
    }
}