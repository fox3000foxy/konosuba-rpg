const Creature = require("./Creature")
module.exports = class Horse extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [0, 8];
        this.love = 5;
        this.hpMax = 13;
        this.hp = this.hpMax;
        this.name = "Cheval";
        this.images = ["horse_normal"];
        this.hugged = false;
    }

    giveHug() {
        super.giveHug();
        this.hugged = true;
    }

    turn() {
        if (this.hugged) {
            this.hugged = false;
            return [`Le ${this.name} t'embrasse en retour !`, 0];
        }
        const dmg = this.rand.integer(this.attack[0], this.attack[1]);
        return [`Le ${this.name} t'attaque et t'inflige ${dmg} dégats.`, dmg];
    }
}