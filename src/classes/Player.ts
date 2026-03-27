import { Errors } from "../enums/Errors";
import { Gender } from "../enums/Gender";
import { AquaImages } from "../enums/player/AquaImages";
import { DarknessImages } from "../enums/player/DarknessImages";
import { KazumaImages } from "../enums/player/KazumaImages";
import { MeguminImages } from "../enums/player/MeguminImages";
import { PlayerAction } from "../enums/player/PlayerAction";
import { PlayerLore } from "../enums/player/PlayerLore";
import { PlayerStats } from "../enums/player/PlayerStats";
import { PlayerThmb } from "../enums/player/PlayerThmb";

// Abstract Player class
export abstract class Player {
  public hpMax: number;
  public hp: number;
  public attack: [number, number];
  public defending: boolean;
  public name: [string, string]; // [français, anglais]
  public images: string[];
  public icon:
    | PlayerThmb.Kazuma
    | PlayerThmb.Darkness
    | PlayerThmb.Megumin
    | PlayerThmb.Aqua;
  public lore: string;
  public gender: Gender;
  protected specialAttackNeededRounds: number = 0;
  protected specialAttackCurrentRounds: number = 0;
  public specialAttackReady: boolean = false;
  public playerId: number = 0;
  public team: Team | null = null;

  constructor(
    name: [string, string],
    hpMax: number,
    attack: [number, number],
    images: string[],
    icon:
      | PlayerThmb.Kazuma
      | PlayerThmb.Darkness
      | PlayerThmb.Megumin
      | PlayerThmb.Aqua,
    lore: string,
    gender: Gender
  ) {
    this.hpMax = hpMax;
    this.hp = hpMax;
    this.attack = attack;
    this.defending = false;
    this.name = name;
    this.images = images;
    this.icon = icon;
    this.lore = lore;
    this.gender = gender;
    this.specialAttackNeededRounds = 0;
    this.specialAttackCurrentRounds = 0;
    this.specialAttackReady = false;

    if (new.target === Player) {
      throw new Error(Errors.ABSTRACT_ERROR);
    }
  }

  abstract performAction(action: PlayerAction): void;
  resetSpecialAttack() {
    this.specialAttackReady = false;
    this.specialAttackCurrentRounds = 0;
  }

  getTeam (): Team {
	if (!this.team) {
	  throw new Error("Player is not assigned to a team.");
	}
	return this.team;
  }

  setTeam(team: Team) {
	this.team = team;
  }
}

// Kazuma — Aventurier bas niveau, polyvalent mais physiquement faible
// HP: 80 | Atk: [3, 12]
export class Kazuma extends Player {
  constructor() {
    super(
      ["Kazuma", "Kazuma"],
      PlayerStats.KazumaHp,
      [PlayerStats.KazumaAttackMin, PlayerStats.KazumaAttackMax],
      [KazumaImages.Idle],
      PlayerThmb.Kazuma,
      PlayerLore.Kazuma,
      Gender.Male
    );
    this.specialAttackNeededRounds = 3; // Kazuma's special attack is ready after 3 rounds
    this.playerId = 0;
  }

  performAction(action: PlayerAction): void {
    this.specialAttackCurrentRounds++;
    if (
      !this.specialAttackReady &&
      this.specialAttackCurrentRounds >= this.specialAttackNeededRounds
    ) {
      this.specialAttackReady = true;
      this.specialAttackCurrentRounds = 0;
    }
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
      case PlayerAction.Spe:
        this.images = [KazumaImages.Atk];
        this.specialAttackReady = false;
        this.specialAttackCurrentRounds = 0;
        break;
    }
  }
}

// Darkness — Chevalier croisé, tank absolu mais rate constamment ses frappes
// HP: 200 | Atk: [0, 8]
export class Darkness extends Player {
  constructor() {
    super(
      ["Lalatina", "Darkness"],
      PlayerStats.DarknessHp,
      [PlayerStats.DarknessAttackMin, PlayerStats.DarknessAttackMax],
      [DarknessImages.Idle],
      PlayerThmb.Darkness,
      PlayerLore.Darkness,
      Gender.Female
    );
    this.specialAttackNeededRounds = 5; // Darkness's special attack is ready after 5 rounds
    this.playerId = 1;
  }

  performAction(action: PlayerAction): void {
    this.specialAttackCurrentRounds++;
    if (
      !this.specialAttackReady &&
      this.specialAttackCurrentRounds >= this.specialAttackNeededRounds
    ) {
      this.specialAttackReady = true;
      this.specialAttackCurrentRounds = 0;
    }
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
      case PlayerAction.Spe:
        this.images = [DarknessImages.Atk];
        this.specialAttackReady = false;
        this.specialAttackCurrentRounds = 0;
        break;
    }
  }
}

// Megumin — Archimage, Explosion dévastatrice mais instable (peut s'effondrer après)
// HP: 60 | Atk: [0, 60]
export class Megumin extends Player {
  constructor() {
    super(
      ["Megumin", "Megumin"],
      PlayerStats.MeguminHp,
      [PlayerStats.MeguminAttackMin, PlayerStats.MeguminAttackMax],
      [MeguminImages.Idle],
      PlayerThmb.Megumin,
      PlayerLore.Megumin,
      Gender.Female
    );
    this.specialAttackNeededRounds = 4; // Megumin's special attack is ready after 4 rounds
    this.playerId = 2;
  }

  performAction(action: PlayerAction): void {
    this.specialAttackCurrentRounds++;
    if (
      !this.specialAttackReady &&
      this.specialAttackCurrentRounds >= this.specialAttackNeededRounds
    ) {
      this.specialAttackReady = true;
      this.specialAttackCurrentRounds = 0;
    }
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
      case PlayerAction.Spe:
        this.images = [MeguminImages.Atk];
        this.specialAttackReady = false;
        this.specialAttackCurrentRounds = 0;
        break;
    }
  }
}

// Aqua — Déesse de l'eau, soins divins mais piètre combattante directe
// HP: 100 | Atk: [1, 6]
export class Aqua extends Player {
  constructor() {
    super(
      ["Aqua", "Aqua"],
      PlayerStats.AquaHp,
      [PlayerStats.AquaAttackMin, PlayerStats.AquaAttackMax],
      [AquaImages.Idle],
      PlayerThmb.Aqua,
      PlayerLore.Aqua,
      Gender.Female
    );
    this.specialAttackNeededRounds = 3; // Aqua's special attack is ready after 3 rounds
    this.playerId = 3;
  }

  performAction(action: PlayerAction): void {
    this.specialAttackCurrentRounds++;
    if (
      !this.specialAttackReady &&
      this.specialAttackCurrentRounds >= this.specialAttackNeededRounds
    ) {
      this.specialAttackReady = true;
      this.specialAttackCurrentRounds = 0;
    }
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
      case PlayerAction.Spe:
        this.images = [AquaImages.Atk];
        this.specialAttackReady = false;
        this.specialAttackCurrentRounds = 0;
        break;
    }
  }

  heal(team: Team) {
    team.players.forEach((player) => {
      if (player.hp > 0) {
        player.hp = Math.min(player.hp + 15, player.hpMax);
      }
    });
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
    this.players.forEach((player, index) => {
      player.playerId = index;
    });
  }

  performTeamAction(action: PlayerAction): void {
    this.players.forEach((player) => player.performAction(action));
  }

  setActivePlayer(player: Player): void {
    this.activePlayer = player;
  }
}
