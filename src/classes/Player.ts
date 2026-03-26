import { Errors } from "../enums/Errors";
import { AquaImages } from "../enums/player/AquaImages";
import { DarknessImages } from "../enums/player/DarknessImages";
import { KazumaImages } from "../enums/player/KazumaImages";
import { MeguminImages } from "../enums/player/MeguminImages";
import { PlayerAction } from "../enums/player/PlayerAction";
import { PlayerName } from "../enums/player/PlayerName";
import { PlayerStats } from "../enums/player/PlayerStats";
import { PlayerThmb } from "../enums/player/PlayerThmb";

// Abstract Player class
export abstract class Player {
	public hpMax: number;
	public hp: number;
	public attack: [number, number];
	public defending: boolean;
	public name: PlayerName;
	public images: string[];
	public icon: PlayerThmb.Kazuma | PlayerThmb.Darkness | PlayerThmb.Megumin | PlayerThmb.Aqua;

	constructor(name: PlayerName, hpMax: number, attack: [number, number], images: string[], icon: PlayerThmb.Kazuma | PlayerThmb.Darkness | PlayerThmb.Megumin | PlayerThmb.Aqua) {
		this.hpMax = hpMax;
		this.hp = hpMax;
		this.attack = attack;
		this.defending = false;
		this.name = name;
		this.images = images;
		this.icon = icon;

		if (new.target === Player) {
			throw new Error(Errors.ABSTRACT_ERROR);
		}
	}

	abstract performAction(action: PlayerAction): void;
}

// Subclasses for each player
export class Kazuma extends Player {
	constructor() {
		super(PlayerName.Kazuma, PlayerStats.KazumaHp, [PlayerStats.KazumaAttackMin, PlayerStats.KazumaAttackMax], [KazumaImages.Idle], PlayerThmb.Kazuma);
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
	constructor() {
		super(PlayerName.Darkness, PlayerStats.DarknessHp, [PlayerStats.DarknessAttackMin, PlayerStats.DarknessAttackMax], [DarknessImages.Idle], PlayerThmb.Darkness);
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
	constructor() {
		super(PlayerName.Megumin, PlayerStats.MeguminHp, [PlayerStats.MeguminAttackMin, PlayerStats.MeguminAttackMax], [MeguminImages.Idle], PlayerThmb.Megumin);
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
	constructor() {
		super(PlayerName.Aqua, PlayerStats.AquaHp, [PlayerStats.AquaAttackMin, PlayerStats.AquaAttackMax], [AquaImages.Idle], PlayerThmb.Aqua);
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

	constructor() {
		this.players = [
			new Kazuma(),
			new Darkness(),
			new Megumin(),
			new Aqua(),
		];
	}

	performTeamAction(action: PlayerAction): void {
		this.players.forEach(player => player.performAction(action));
	}

	setActivePlayer(player: Player): void {
		this.activePlayer = player;
	}
}