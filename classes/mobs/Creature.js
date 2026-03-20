module.exports = class Creature {
    constructor(rand) {
        this.rand = rand;
        this.hpMax = 10;
        this.hp = this.hpMax;
        this.attack = [0, 12];
        this.love = 10;
        this.name = "Creature";
        this.images = ["frame"];
		this.prefix = true
    }

    giveHug() {
        this.love -= 1;
    }

    turn(lang) {
        const dmg = this.rand.integer(this.attack[0], this.attack[1]);
		if(lang=="fr")
			if(dmg)
				return [`${this.prefix?"Le ":""}${this.name} l'attaque et lui inflige ${dmg} dégats.`, dmg];
			else
				return [`${this.prefix?"Le ":""}${this.name} a essayé de l'attaquer mais l'a donc raté.`, dmg];
		else
			if(dmg)
				return [`${this.prefix?"The ":""}${this.name} attacks and deal ${dmg} DMG.`, dmg];
			else
				return [`${this.prefix?"The ":""}${this.name} tried to attack but missed.`, dmg];
    }

    dealAttack(dmg) {
        this.hp -= dmg;
    }
}
