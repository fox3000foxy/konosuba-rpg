/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
import { Random } from "./Random";

// Enum for actions
export enum PlayerAction {
	Def = "Def",
	Atk = "Atk",
	Hug = "Hug",
	Idle = "Idle",
}

// Enum for player names
export enum PlayerName {
	Kazuma = "Kazuma",
	Darkness = "Darkness",
	Megumin = "Megumin",
	Aqua = "Aqua",
}

// Enum for character images
export enum KazumaImages {
	Idle = "character_kazuma01",
	Def = "character_kazuma03",
	Atk = "character_kazuma02",
	Hug = "character_kazuma04",
}

export enum DarknessImages {
	Idle = "character_daku01",
	Def = "character_daku03",
	Atk = "character_daku02",
	Hug = "character_daku04",
}

export enum MeguminImages {
	Idle = "character_meg01",
	Def = "character_meg03",
	Atk = "character_meg02",
	Hug = "character_meg04",
}

export enum AquaImages {
	Idle = "character_aqua01",
	Def = "character_aqua03",
	Atk = "character_aqua02",
	Hug = "character_aqua04",
}

export enum PlayerThmb {
	Kazuma = 'https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/player/thmb_in_1001100.png',
	Darkness = 'https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/player/thmb_in_1031100.png',
	Megumin = 'https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/player/thmb_in_1021100.png',
	Aqua = 'https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/player/thmb_in_1011100.png',
}

// Enum for character stats
export enum PlayerStats {
	KazumaHp = 40,
	KazumaAttackMin = 6,
	KazumaAttackMax = 12,

	DarknessHp = 80,
	DarknessAttackMin = 0,
	DarknessAttackMax = 6,

	MeguminHp = 30,
	MeguminAttackMin = 25,
	MeguminAttackMax = 25,

	AquaHp = 40,
	AquaAttackMin = 6,
	AquaAttackMax = 12,
}

// Abstract Player class
export abstract class Player {
	rand: Random;
	hpMax: number;
	hp: number;
	attack: [number, number];
	defending: boolean;
	name: PlayerName;
	images: string[];
	icon: PlayerThmb.Kazuma | PlayerThmb.Darkness | PlayerThmb.Megumin | PlayerThmb.Aqua;

	constructor(rand: Random, name: PlayerName, hpMax: number, attack: [number, number], images: string[], icon: PlayerThmb.Kazuma | PlayerThmb.Darkness | PlayerThmb.Megumin | PlayerThmb.Aqua) {
		this.rand = rand;
		this.hpMax = hpMax;
		this.hp = hpMax;
		this.attack = attack;
		this.defending = false;
		this.name = name;
		this.images = images;
		this.icon = icon;

		if (new.target === Player) {
			throw new Error("This is an abstract class, you should not instantiate it directly.");
		}
	}

	abstract performAction(action: PlayerAction): void;
}

// Subclasses for each player
export class Kazuma extends Player {
	constructor(rand: Random) {
		super(rand, PlayerName.Kazuma, PlayerStats.KazumaHp, [PlayerStats.KazumaAttackMin, PlayerStats.KazumaAttackMax], [KazumaImages.Idle], PlayerThmb.Kazuma);
	}

	performAction(action: PlayerAction): void {
		switch (action) {
			case PlayerAction.Idle:
				this.images = [KazumaImages.Idle];
				break;
			case PlayerAction.Def:
				this.images = [KazumaImages.Def];
				break;
			case PlayerAction.Atk:
				this.images = [KazumaImages.Atk];
				break;
			case PlayerAction.Hug:
				this.images = [KazumaImages.Hug];
				break;
		}
	}
}

export class Darkness extends Player {
	constructor(rand: Random) {
		super(rand, PlayerName.Darkness, PlayerStats.DarknessHp, [PlayerStats.DarknessAttackMin, PlayerStats.DarknessAttackMax], [DarknessImages.Idle], PlayerThmb.Darkness);
	}

	performAction(action: PlayerAction): void {
		switch (action) {
			case PlayerAction.Idle:
				this.images = [DarknessImages.Idle];
				break;
			case PlayerAction.Def:
				this.images = [DarknessImages.Def];
				break;
			case PlayerAction.Atk:
				this.images = [DarknessImages.Atk];
				break;
			case PlayerAction.Hug:
				this.images = [DarknessImages.Hug];
				break;
		}
	}
}

export class Megumin extends Player {
	constructor(rand: Random) {
		super(rand, PlayerName.Megumin, PlayerStats.MeguminHp, [PlayerStats.MeguminAttackMin, PlayerStats.MeguminAttackMax], [MeguminImages.Idle], PlayerThmb.Megumin);
	}

	performAction(action: PlayerAction): void {
		switch (action) {
			case PlayerAction.Idle:
				this.images = [MeguminImages.Idle];
				break;
			case PlayerAction.Def:
				this.images = [MeguminImages.Def];
				break;
			case PlayerAction.Atk:
				this.images = [MeguminImages.Atk];
				break;
			case PlayerAction.Hug:
				this.images = [MeguminImages.Hug];
				break;
		}
	}
}

export class Aqua extends Player {
	constructor(rand: Random) {
		super(rand, PlayerName.Aqua, PlayerStats.AquaHp, [PlayerStats.AquaAttackMin, PlayerStats.AquaAttackMax], [AquaImages.Idle], PlayerThmb.Aqua);
	}

	performAction(action: PlayerAction): void {
		switch (action) {
			case PlayerAction.Idle:
				this.images = [AquaImages.Idle];
				break;
			case PlayerAction.Def:
				this.images = [AquaImages.Def];
				break;
			case PlayerAction.Atk:
				this.images = [AquaImages.Atk];
				break;
			case PlayerAction.Hug:
				this.images = [AquaImages.Hug];
				break;
		}
	}
}

// Team class
export class Team {
	players: Player[];
	activePlayer: Player | null = null;

	constructor(rand: Random) {
		this.players = [
			new Kazuma(rand),
			new Darkness(rand),
			new Megumin(rand),
			new Aqua(rand),
		];
	}

	performTeamAction(action: PlayerAction): void {
		this.players.forEach(player => player.performAction(action));
	}

	setActivePlayer(player: Player): void {
		this.activePlayer = player;
	}
}