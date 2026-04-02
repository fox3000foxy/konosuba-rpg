import { EnglishLore } from '../objects/enums/EnglishLore';
import { Errors } from '../objects/enums/Errors';
import { FrenchLores } from '../objects/enums/FrenchLores';
import { Gender } from '../objects/enums/Gender';
import { AquaImages } from '../objects/enums/player/AquaImages';
import { DarknessImages } from '../objects/enums/player/DarknessImages';
import { KazumaImages } from '../objects/enums/player/KazumaImages';
import { MeguminImages } from '../objects/enums/player/MeguminImages';
import { PlayerAction } from '../objects/enums/player/PlayerAction';
import { PlayerStats } from '../objects/enums/player/PlayerStats';
import { PlayerThmb } from '../objects/enums/player/PlayerThmb';

type ActionImageMap = Partial<Record<PlayerAction, string>>;

const KAZUMA_IMAGE_BY_ACTION: ActionImageMap = {
  [PlayerAction.Idle]: KazumaImages.Idle,
  [PlayerAction.Def]: KazumaImages.Def,
  [PlayerAction.Atk]: KazumaImages.Atk,
  [PlayerAction.Hug]: KazumaImages.Hug,
  [PlayerAction.Spe]: KazumaImages.Atk,
  [PlayerAction.Use]: KazumaImages.Idle, // Using item defaults to idle
};

const DARKNESS_IMAGE_BY_ACTION: ActionImageMap = {
  [PlayerAction.Idle]: DarknessImages.Idle,
  [PlayerAction.Def]: DarknessImages.Def,
  [PlayerAction.Atk]: DarknessImages.Atk,
  [PlayerAction.Hug]: DarknessImages.Hug,
  [PlayerAction.Spe]: DarknessImages.Atk,
  [PlayerAction.Use]: DarknessImages.Idle,
};

const MEGUMIN_IMAGE_BY_ACTION: ActionImageMap = {
  [PlayerAction.Idle]: MeguminImages.Idle,
  [PlayerAction.Def]: MeguminImages.Def,
  [PlayerAction.Atk]: MeguminImages.Atk,
  [PlayerAction.Hug]: MeguminImages.Hug,
  [PlayerAction.Spe]: MeguminImages.Atk,
  [PlayerAction.Use]: MeguminImages.Idle,
};

const AQUA_IMAGE_BY_ACTION: ActionImageMap = {
  [PlayerAction.Idle]: AquaImages.Idle,
  [PlayerAction.Def]: AquaImages.Def,
  [PlayerAction.Atk]: AquaImages.Atk,
  [PlayerAction.Hug]: AquaImages.Hug,
  [PlayerAction.Spe]: AquaImages.Atk,
  [PlayerAction.Use]: AquaImages.Idle,
};

// Abstract Player class
export abstract class Player {
  public hpMax: number;
  public hp: number;
  public attack: [number, number];
  public defense: number;
  public defending: boolean;
  public name: [string, string]; // [français, anglais]
  public images: string[];
  public icon: PlayerThmb.Kazuma | PlayerThmb.Darkness | PlayerThmb.Megumin | PlayerThmb.Aqua;
  public lore: string[];
  public gender: Gender;
  protected specialAttackNeededRounds: number = 0;
  protected specialAttackCurrentRounds: number = 0;
  public specialAttackReady: boolean = false;
  public playerId: number = 0;
  public team: Team | null = null;

  constructor(name: [string, string], hpMax: number, attack: [number, number], images: string[], icon: PlayerThmb.Kazuma | PlayerThmb.Darkness | PlayerThmb.Megumin | PlayerThmb.Aqua, lore: string[], gender: Gender) {
    this.hpMax = hpMax;
    this.hp = hpMax;
    this.attack = attack;
    this.defense = 0;
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

  protected progressSpecialAttack() {
    this.specialAttackCurrentRounds += 1;
    if (!this.specialAttackReady && this.specialAttackCurrentRounds >= this.specialAttackNeededRounds) {
      this.specialAttackReady = true;
      this.specialAttackCurrentRounds = 0;
    }
  }

  protected consumeSpecialAttack() {
    this.specialAttackReady = false;
    this.specialAttackCurrentRounds = 0;
  }

  protected performMappedAction(action: PlayerAction, imageByAction: ActionImageMap) {
    this.progressSpecialAttack();
    const image = imageByAction[action];
    if (image) {
      this.images = [image];
    }
    if (action === PlayerAction.Spe) {
      this.consumeSpecialAttack();
    }
  }

  getTeam(): Team {
    if (!this.team) {
      throw new Error('Player is not assigned to a team.');
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
    super(['Kazuma', 'Kazuma'], PlayerStats.KazumaHp, [PlayerStats.KazumaAttackMin, PlayerStats.KazumaAttackMax], [KazumaImages.Idle], PlayerThmb.Kazuma, [FrenchLores.Player_Kazuma, EnglishLore.Player_Kazuma], Gender.Male);
    this.specialAttackNeededRounds = 3; // Kazuma's special attack is ready after 3 rounds
    this.playerId = 0;
  }

  performAction(action: PlayerAction): void {
    this.performMappedAction(action, KAZUMA_IMAGE_BY_ACTION);
  }
}

// Darkness — Chevalier croisé, tank absolu mais rate constamment ses frappes
// HP: 200 | Atk: [0, 8]
export class Darkness extends Player {
  constructor() {
    super(['Lalatina', 'Darkness'], PlayerStats.DarknessHp, [PlayerStats.DarknessAttackMin, PlayerStats.DarknessAttackMax], [DarknessImages.Idle], PlayerThmb.Darkness, [FrenchLores.Player_Darkness, EnglishLore.Player_Darkness], Gender.Female);
    this.specialAttackNeededRounds = 5; // Darkness's special attack is ready after 5 rounds
    this.playerId = 1;
  }

  performAction(action: PlayerAction): void {
    this.performMappedAction(action, DARKNESS_IMAGE_BY_ACTION);
  }
}

// Megumin — Archimage, Explosion dévastatrice mais instable (peut s'effondrer après)
// HP: 60 | Atk: [0, 60]
export class Megumin extends Player {
  constructor() {
    super(['Megumin', 'Megumin'], PlayerStats.MeguminHp, [PlayerStats.MeguminAttackMin, PlayerStats.MeguminAttackMax], [MeguminImages.Idle], PlayerThmb.Megumin, [FrenchLores.Player_Megumin, EnglishLore.Player_Megumin], Gender.Female);
    this.specialAttackNeededRounds = 4; // Megumin's special attack is ready after 4 rounds
    this.playerId = 2;
  }

  performAction(action: PlayerAction): void {
    this.performMappedAction(action, MEGUMIN_IMAGE_BY_ACTION);
  }
}

// Aqua — Déesse de l'eau, soins divins mais piètre combattante directe
// HP: 100 | Atk: [1, 6]
export class Aqua extends Player {
  constructor() {
    super(['Aqua', 'Aqua'], PlayerStats.AquaHp, [PlayerStats.AquaAttackMin, PlayerStats.AquaAttackMax], [AquaImages.Idle], PlayerThmb.Aqua, [FrenchLores.Player_Aqua, EnglishLore.Player_Aqua], Gender.Female);
    this.specialAttackNeededRounds = 3; // Aqua's special attack is ready after 3 rounds
    this.playerId = 3;
  }

  performAction(action: PlayerAction): void {
    this.performMappedAction(action, AQUA_IMAGE_BY_ACTION);
  }

  heal(team: Team = this.getTeam()) {
    team.players.forEach(player => {
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
    this.players = [new Kazuma(), new Darkness(), new Megumin(), new Aqua()];
    this.players.forEach((player, index) => {
      player.playerId = index;
      player.setTeam(this);
    });
  }

  performTeamAction(action: PlayerAction): void {
    this.players.forEach(player => player.performAction(action));
  }

  setActivePlayer(player: Player): void {
    this.activePlayer = player;
  }
}
