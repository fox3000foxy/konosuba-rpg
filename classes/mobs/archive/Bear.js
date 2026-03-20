const Creature = require("./Creature")
module.exports = class Bear extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [1, 10];
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.love = 3;
        this.name = "Ours";
        this.images = ["bear_normal"];
    }

    turn() {
        const dmg = this.rand.integer(this.attack[0], this.attack[1]);
        if (this.rand.integer(0, 1) === 1) {
            return [`Le ${this.name} t'attaque et t'inflige ${dmg} dégats.`, dmg];
        } else {
            return [`Le ${this.name} a raté son attaque et ne t'inflige aucun dégatss.`, 0];
        }
    }
}