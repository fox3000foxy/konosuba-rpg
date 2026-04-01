import { CharacterKey } from '../../src/objects/enums/CharacterKey';
import { GameState } from '../../src/objects/enums/GameState';
import { syncAchievements } from '../../src/services/achievementService';
import {
    addCharacterXp,
    ensureCharacterProgress,
} from '../../src/services/characterService';
import {
    grantAccessoryDropRewards,
    grantConsumableDropRewards,
} from '../../src/services/dropService';
import { ensurePlayerProfile } from '../../src/services/playerService';
import { recordRunResult } from '../../src/services/progressionService';
import { getSupabaseAdminClient } from '../../src/utils/supabaseClient';

type MockDbError = { message: string };

type MockResponse = {
  table: string;
  op: string;
  data?: unknown;
  error?: MockDbError | null;
};

type MockQuery = {
  table: string;
  op: string;
  filters: Array<{ column: string; value: unknown }>;
  payload?: unknown;
};

jest.mock('../../src/utils/supabaseClient', () => ({
  getSupabaseAdminClient: jest.fn(),
}));

jest.mock('../../src/services/playerService', () => ({
  ensurePlayerProfile: jest.fn(),
  getLeaderboard: jest.fn(),
  getPlayerProfile: jest.fn(),
  getPlayerRunSummary: jest.fn(),
}));

jest.mock('../../src/services/characterService', () => ({
  addCharacterXp: jest.fn(),
  ensureCharacterProgress: jest.fn(),
  computeLevelFromXp: jest.fn(),
  getCharacterProgress: jest.fn(),
  getCharacterProgresses: jest.fn(),
  getCharacterStatsSnapshot: jest.fn(),
  getLevelFactor: jest.fn(),
}));

jest.mock('../../src/services/achievementService', () => ({
  syncAchievements: jest.fn(),
  ACHIEVEMENTS: [],
  getAchievementsOverview: jest.fn(),
}));

jest.mock('../../src/services/dropService', () => ({
  grantAccessoryDropRewards: jest.fn(),
  grantConsumableDropRewards: jest.fn(),
}));

const mockedGetSupabaseAdminClient = getSupabaseAdminClient as jest.MockedFunction<
  typeof getSupabaseAdminClient
>;

const mockedEnsurePlayerProfile = ensurePlayerProfile as jest.MockedFunction<
  typeof ensurePlayerProfile
>;

const mockedEnsureCharacterProgress = ensureCharacterProgress as jest.MockedFunction<
  typeof ensureCharacterProgress
>;

const mockedAddCharacterXp = addCharacterXp as jest.MockedFunction<
  typeof addCharacterXp
>;

const mockedSyncAchievements = syncAchievements as jest.MockedFunction<
  typeof syncAchievements
>;

const mockedGrantAccessoryDropRewards = grantAccessoryDropRewards as jest.MockedFunction<
  typeof grantAccessoryDropRewards
>;

const mockedGrantConsumableDropRewards = grantConsumableDropRewards as jest.MockedFunction<
  typeof grantConsumableDropRewards
>;

class QueryBuilder implements PromiseLike<{ data: unknown; error: MockDbError | null }> {
  private readonly query: MockQuery;

  constructor(
    private readonly client: SupabaseMockClient,
    table: string
  ) {
    this.query = {
      table,
      op: 'unknown',
      filters: [],
    };
  }

  select(): this {
    this.query.op = 'select';
    return this;
  }

  upsert(payload: unknown): this {
    this.query.op = 'upsert';
    this.query.payload = payload;
    return this;
  }

  insert(payload: unknown): this {
    this.query.op = 'insert';
    this.query.payload = payload;
    return this;
  }

  update(payload: unknown): this {
    this.query.op = 'update';
    this.query.payload = payload;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.query.filters.push({ column, value });
    return this;
  }

  single(): this {
    return this;
  }

  maybeSingle(): this {
    return this;
  }

  then<TResult1 = { data: unknown; error: MockDbError | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: MockDbError | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.client.consume(this.query)).then(onfulfilled, onrejected);
  }
}

class SupabaseMockClient {
  public readonly queries: MockQuery[] = [];

  constructor(private readonly scriptedResponses: MockResponse[]) {}

  from(table: string): QueryBuilder {
    return new QueryBuilder(this, table);
  }

  consume(query: MockQuery): { data: unknown; error: MockDbError | null } {
    this.queries.push(query);

    const next = this.scriptedResponses.shift();
    if (!next) {
      throw new Error(`No mocked response left for ${query.table}.${query.op}`);
    }

    if (next.table !== query.table || next.op !== query.op) {
      throw new Error(
        `Unexpected query ${query.table}.${query.op}, expected ${next.table}.${next.op}`
      );
    }

    return {
      data: next.data,
      error: next.error ?? null,
    };
  }
}

describe('recordRunResult integration-like flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    mockedEnsurePlayerProfile.mockResolvedValue(undefined);
    mockedEnsureCharacterProgress.mockResolvedValue(undefined);
    mockedAddCharacterXp.mockResolvedValue(undefined);
    mockedSyncAchievements.mockResolvedValue(undefined);
    mockedGrantAccessoryDropRewards.mockResolvedValue(null);
    mockedGrantConsumableDropRewards.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('awards character xp for Darkness, Megumin, and Aqua when a run is recorded', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'runs',
        op: 'upsert',
        data: null,
      },
      {
        table: 'players',
        op: 'select',
        data: { xp: 0, level: 1 },
      },
      {
        table: 'players',
        op: 'update',
        data: null,
      },
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: null,
      },
      {
        table: 'daily_quests_progress',
        op: 'insert',
        data: null,
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    await recordRunResult({
      userId: 'user-1',
      payload: 'seed123/atk',
      state: GameState.Giveup,
      training: false,
      monsterName: 'Troll',
    });

    expect(mockedEnsurePlayerProfile).toHaveBeenCalledWith('user-1');
    expect(mockedEnsureCharacterProgress).not.toHaveBeenCalled();

    expect(mockedAddCharacterXp).toHaveBeenCalledTimes(3);
    expect(mockedAddCharacterXp).toHaveBeenNthCalledWith(
      1,
      'user-1',
      CharacterKey.Darkness,
      2
    );
    expect(mockedAddCharacterXp).toHaveBeenNthCalledWith(
      2,
      'user-1',
      CharacterKey.Megumin,
      2
    );
    expect(mockedAddCharacterXp).toHaveBeenNthCalledWith(
      3,
      'user-1',
      CharacterKey.Aqua,
      2
    );

    expect(mockedSyncAchievements).toHaveBeenCalledWith('user-1');
    expect(mockedGrantAccessoryDropRewards).not.toHaveBeenCalled();
    expect(mockedGrantConsumableDropRewards).not.toHaveBeenCalled();

    expect(client.queries[0].table).toBe('runs');
    expect(client.queries[0].op).toBe('upsert');
    expect(client.queries[0].payload).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        run_key: 'user-1:seed123/atk',
        monster_name: 'Troll',
      })
    );
  });

  it('triggers accessory drop rewards on winning runs', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'runs',
        op: 'upsert',
        data: null,
      },
      {
        table: 'players',
        op: 'select',
        data: { xp: 0, level: 1 },
      },
      {
        table: 'players',
        op: 'update',
        data: null,
      },
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: null,
      },
      {
        table: 'daily_quests_progress',
        op: 'insert',
        data: null,
      },
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: null,
      },
      {
        table: 'daily_quests_progress',
        op: 'insert',
        data: null,
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    await recordRunResult({
      userId: 'winner-1',
      payload: 'seedwin/atk',
      state: GameState.Good,
      training: false,
      monsterName: 'Dragon',
    });

    expect(mockedGrantAccessoryDropRewards).toHaveBeenCalledWith(
      'winner-1',
      'winner-1:seedwin/atk',
      'Dragon'
    );
    expect(mockedGrantConsumableDropRewards).toHaveBeenCalledWith(
      'winner-1',
      'winner-1:seedwin/atk',
      'Dragon'
    );
  });
});
