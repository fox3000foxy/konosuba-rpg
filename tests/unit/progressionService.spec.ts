import { GameState } from '../../src/enums/GameState';
import {
  claimDailyQuestReward,
  getAllQuestStatuses,
  getDailyQuestStatus,
  getLeaderboard,
} from '../../src/services/progressionService';
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
  orders: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  payload?: unknown;
};

jest.mock('../../src/utils/supabaseClient', () => ({
  getSupabaseAdminClient: jest.fn(),
}));

const mockedGetSupabaseAdminClient = getSupabaseAdminClient as jest.MockedFunction<
  typeof getSupabaseAdminClient
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
      orders: [],
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

  order(column: string, options?: { ascending?: boolean }): this {
    this.query.orders.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  limit(value: number): this {
    this.query.limit = value;
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

describe('progressionService with Supabase interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null leaderboard when Supabase client is unavailable', async () => {
    mockedGetSupabaseAdminClient.mockReturnValue(null);

    const leaderboard = await getLeaderboard(10);

    expect(leaderboard).toBeNull();
  });

  it('maps leaderboard and clamps limit to 25', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'players',
        op: 'select',
        data: [
          { user_id: 'u2', level: 3, xp: 180 },
          { user_id: 'u1', level: 2, xp: 95 },
        ],
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const leaderboard = await getLeaderboard(200);

    expect(leaderboard).toEqual([
      { userId: 'u2', level: 3, xp: 180 },
      { userId: 'u1', level: 2, xp: 95 },
    ]);
    expect(client.queries).toHaveLength(1);
    expect(client.queries[0].limit).toBe(25);
    expect(client.queries[0].orders).toEqual([
      { column: 'level', ascending: false },
      { column: 'xp', ascending: false },
    ]);
  });

  it('returns default quest status when no row exists for today', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: null,
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const status = await getDailyQuestStatus('user-1');

    expect(status).not.toBeNull();
    expect(status?.questKey).toBe('win_1_run');
    expect(status?.progress).toBe(0);
    expect(status?.target).toBe(1);
    expect(status?.claimed).toBe(false);
    expect(status?.rewardGold).toBe(50);
  });

  it('claims quest reward and updates player gold', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: { progress: 1, claimed: false },
      },
      {
        table: 'daily_quests_progress',
        op: 'update',
        data: null,
      },
      {
        table: 'players',
        op: 'select',
        data: { gold: 10 },
      },
      {
        table: 'players',
        op: 'update',
        data: null,
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const result = await claimDailyQuestReward('user-1');

    expect(result).toEqual({ status: 'claimed', rewardGold: 50 });
    expect(client.queries).toHaveLength(4);

    const markClaimedQuery = client.queries[1];
    expect(markClaimedQuery.table).toBe('daily_quests_progress');
    expect(markClaimedQuery.op).toBe('update');
    expect(markClaimedQuery.filters).toEqual(
      expect.arrayContaining([
        { column: 'user_id', value: 'user-1' },
        { column: 'quest_key', value: 'win_1_run' },
      ])
    );

    const goldUpdateQuery = client.queries[3];
    expect(goldUpdateQuery.table).toBe('players');
    expect(goldUpdateQuery.op).toBe('update');
    expect(goldUpdateQuery.payload).toEqual(
      expect.objectContaining({ gold: 60 })
    );
  });

  it('does not claim quest when progress is below target', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: { progress: 0, claimed: false },
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const result = await claimDailyQuestReward('user-1');

    expect(result).toEqual({ status: 'not-completed', rewardGold: 0 });
    expect(client.queries).toHaveLength(1);
  });

  it('handles leaderboard DB errors by returning null', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'players',
        op: 'select',
        error: { message: 'temporary outage' },
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const leaderboard = await getLeaderboard(5);

    expect(leaderboard).toBeNull();
  });

  it('keeps enum coverage sanity for winning quest states', () => {
    expect(GameState.Good).toBe('good');
    expect(GameState.Best).toBe('best');
  });

  it('getAllQuestStatuses fetches all three quests for a user', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: { progress: 1, claimed: false },
      },
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: { progress: 2, claimed: false },
      },
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: null,
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const statuses = await getAllQuestStatuses('user-1');

    expect(statuses).toHaveLength(3);
    expect(statuses[0]).toMatchObject({ questKey: 'win_1_run', progress: 1 });
    expect(statuses[1]).toMatchObject({ questKey: 'play_3_runs', progress: 2 });
    expect(statuses[2]).toMatchObject({ questKey: 'level_up_once', progress: 0 });
  });

  it('getDailyQuestStatus with quest_id parameter returns specific quest', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: { progress: 3, claimed: true },
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const status = await getDailyQuestStatus('user-1', 'play_3_runs');

    expect(status.questKey).toBe('play_3_runs');
    expect(status.progress).toBe(3);
    expect(status.claimed).toBe(true);
    expect(status.target).toBe(3);
    expect(status.rewardGold).toBe(30);
  });

  it('getDailyQuestStatus never returns null but always defaults', async () => {
    mockedGetSupabaseAdminClient.mockReturnValue(null);

    const status = await getDailyQuestStatus('user-1', 'unknown_quest');

    expect(status).not.toBeNull();
    expect(status.progress).toBe(0);
    expect(status.claimed).toBe(false);
  });

  it('claimDailyQuestReward works with specific quest_id parameter', async () => {
    const client = new SupabaseMockClient([
      {
        table: 'daily_quests_progress',
        op: 'select',
        data: { progress: 30, claimed: false },
      },
      {
        table: 'daily_quests_progress',
        op: 'update',
        data: null,
      },
      {
        table: 'players',
        op: 'select',
        data: { gold: 100 },
      },
      {
        table: 'players',
        op: 'update',
        data: null,
      },
    ]);

    mockedGetSupabaseAdminClient.mockReturnValue(client as never);

    const result = await claimDailyQuestReward('user-1', 'level_up_once');

    expect(result).toEqual({ status: 'claimed', rewardGold: 75 });
    expect(client.queries[1].filters).toEqual(
      expect.arrayContaining([{ column: 'quest_key', value: 'level_up_once' }])
    );
  });
});
