export type PlayerRunSummary = {
  totalRuns: number;
  killedMonsters: Array<{
    name: string;
    count: number;
  }>;
};
