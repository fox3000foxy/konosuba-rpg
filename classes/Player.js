module.exports = class Player {
    constructor(rand,playerId) {
        this.rand = rand;
        this.hpMax = [40,80,30,40];
        this.hp = [...this.hpMax];
        this.attack = [
			[6, 12],
			[0, 6],
			[25, 25],
			[6, 12],
		];
        this.defending = false;
        this.name = ["Kazuma","Darkness","Megumin","Aqua"];
		this.currentPlayerId = 0;
        // this.images = ["wumpus_violent_pose"];
        this.images = [
			["character_kazuma01"],
			["character_daku01"],
			["character_meg01"],
			["character_aqua01"]
		];
    }

    actionDef(msg,playerId) {
        this.images = [
			["character_kazuma0"+(playerId%4==0?"3":"1")],
			["character_daku0"+(playerId%4==1?"3":"1")],
			["character_meg0"+(playerId%4==2?"3":"1")],
			["character_aqua0"+(playerId%4==3?"3":"1")]
		];
    }

    actionAtk(msg,playerId) {
		this.images = [
			["character_kazuma0"+(playerId%4==0?"2":"1")],
			["character_daku0"+(playerId%4==1?"2":"1")],
			["character_meg0"+(playerId%4==2?"2":"1")],
			["character_aqua0"+(playerId%4==3?"2":"1")]
		];
    }

    actionHug(msg,playerId) {
        this.images = [
			["character_kazuma0"+(playerId%4==0?"4":"1")],
			["character_daku0"+(playerId%4==1?"4":"1")],
			["character_meg0"+(playerId%4==2?"4":"1")],
			["character_aqua0"+(playerId%4==3?"4":"1")]
		];
    }
}