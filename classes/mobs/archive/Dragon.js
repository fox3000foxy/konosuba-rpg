const Creature = require("./Creature")
module.exports = class Dragon extends Creature {
    constructor(rand) {
        super(rand);
        this.attack = [8, 16];
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.love = 20;
        this.name = "Dragon";
        this.color = rand.choice(["blue", "green", "orange", "red"]);
        this.images = [`dragon_${this.color}_idle`];
        this.moveCount = 0;
    }

    turn() {
        if (this.moveCount === 2) {
            this.moveCount = 0;
            const dmg = this.rand.integer(this.attack[0], this.attack[1]);
            this.images = ["dragon_fire", `dragon_${this.color}_fire`];
			// if(dmg)
			return [`Le ${this.name} t'attaque et t'inflige ${dmg} dégats.`, dmg];
			// else
				// return [`Le ${this.name} t'attaque et ne t'inflige aucun dégat.`, dmg];
        } else {
            this.moveCount += 1;
            this.images = [`dragon_${this.color}_idle`];
            return ["Le dragon te regarde, perplexe, attendant son tour...", 0];
        }
    }
}