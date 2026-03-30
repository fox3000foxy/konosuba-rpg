/**
 * bench.ts — Benchmark réaliste de renderImage via le vrai pipeline de jeu
 *
 * Au lieu de mocks, on génère de vraies URLs et on passe par processUrl()
 * + processGame() exactement comme le fait le serveur en production.
 *
 * Usage :
 *   RENDER_PERF=1 npx tsx bench.ts
 *   RENDER_PERF=1 npx tsx bench.ts --runs=20 --warmup=3 --seed=hello
 *   RENDER_PERF=1 npx tsx bench.ts --runs=10 --monster=Troll
 *
 * Variables d'environnement :
 *   RENDER_PERF=1    Active l'instrumentation interne des spans
 *   BENCH_RUNS=N     Nombre de runs mesurés (défaut : 10)
 *   BENCH_WARMUP=N   Warm-up ignorés dans les stats (défaut : 2)
 */

import { Lang } from '../objects/enums/Lang';
import processGame from './processGame';
import processUrl from './processUrl';
import {
  PerfReport,
  getCacheDiagnostics,
  getLastPerfReport,
  renderOutputCache,
} from './renderImage';

// ─── Générateur d'URL ─────────────────────────────────────────────────────────

const BASE_URL = 'https://konosuba-rpg.vercel.app';

/**
 * Construit une URL de jeu valide, identique à celles produites par index.ts.
 * Format : https://.../konosuba-rpg/:lang/:seed[/action]*[?monster=X]
 */
function buildUrl(
  seed: string,
  moves: string[],
  lang: Lang | undefined,
  monster?: string
): string {
  const path = [seed, ...moves].join('/');
  const query = monster ? `?monster=${encodeURIComponent(monster)}` : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${query}`;
}

/** Génère un seed alphanumérique aléatoire, même charset que makeid() dans index.ts */
function makeSeed(len = 15): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ─── Scénarios réalistes ──────────────────────────────────────────────────────

interface Scenario {
  name: string;
  seed: string;
  moves: string[];
  lang: Lang | undefined;
  monster?: string;
}

function buildScenarios(fixedSeed: string, fixedMonster?: string): Scenario[] {
  return [
    {
      name: '🆕  Nouvelle partie — aucun coup joué',
      seed: fixedSeed,
      moves: [],
      lang: Lang.French,
      monster: fixedMonster,
    },
    {
      name: '🔁  Cache chaud — même URL exacte (doit être quasi-instantané)',
      seed: fixedSeed,
      moves: [],
      lang: Lang.French,
      monster: fixedMonster,
    },
    {
      name: '⚔️   Partie courte — atk/atk/def (3 coups)',
      seed: fixedSeed,
      moves: ['atk', 'atk', 'def'],
      lang: Lang.French,
      monster: fixedMonster,
    },
    {
      name: '🥊  Partie longue — 10 coups mixtes',
      seed: fixedSeed,
      moves: [
        'atk',
        'atk',
        'def',
        'hug',
        'atk',
        'def',
        'atk',
        'atk',
        'hug',
        'atk',
      ],
      lang: Lang.French,
      monster: fixedMonster,
    },
    {
      name: '🏁  Victoire probable — 20 attaques en rafale',
      seed: fixedSeed,
      moves: Array<string>(20).fill('atk'),
      lang: Lang.French,
      monster: fixedMonster,
    },
    {
      name: '🌐  Locale EN — partie courte',
      seed: fixedSeed,
      moves: ['atk', 'def', 'hug'],
      lang: Lang.English,
      monster: fixedMonster,
    },
    {
      name: '🎲  Seed aléatoire A — cold cache UI garanti',
      seed: makeSeed(),
      moves: ['atk', 'def'],
      lang: Lang.French,
      monster: fixedMonster,
    },
    {
      name: '🎲  Seed aléatoire B — variabilité du rendu',
      seed: makeSeed(),
      moves: ['hug', 'atk', 'atk'],
      lang: Lang.French,
      monster: fixedMonster,
    },
  ];
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
}

function stddev(arr: number[], mean: number): number {
  return Math.sqrt(
    arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / arr.length
  );
}

function fmt(ms: number): string {
  return ms.toFixed(2).padStart(8) + ' ms';
}

function bar(ratio: number, width = 28): string {
  const filled = Math.round(Math.min(ratio, 1) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

interface RunResult {
  timings: number[];
  reports: PerfReport[];
  outputSizes: number[];
  states: (string | null)[];
}

async function runScenario(
  scenario: Scenario,
  runs: number,
  warmup: number
): Promise<RunResult> {
  const timings: number[] = [];
  const reports: PerfReport[] = [];
  const outputSizes: number[] = [];
  const states: (string | null)[] = [];

  const url = buildUrl(
    scenario.seed,
    scenario.moves,
    scenario.lang,
    scenario.monster
  );

  for (let i = 0; i < runs + warmup; i++) {
    const [rand, moves, , monster] = processUrl(url);

    const t0 = performance.now();
    const game = await processGame(
      rand,
      moves,
      monster,
      scenario.lang,
      true /* renderingImage */
    );
    const elapsed = performance.now() - t0;

    if (i >= warmup) {
      timings.push(elapsed);
      outputSizes.push((game.image as Uint8Array | undefined)?.byteLength ?? 0);
      states.push(game.state);
      const report = getLastPerfReport();
      if (report) reports.push({ ...report, spans: [...report.spans] });
    }
  }

  // Log cache diagnostics for the final render cache
  console.log('Render Output Cache Size:', renderOutputCache.size);

  return { timings, reports, outputSizes, states };
}

// ─── Report printer ───────────────────────────────────────────────────────────

function printScenarioReport(
  scenario: Scenario,
  url: string,
  result: RunResult
): void {
  const { timings, reports, outputSizes, states } = result;
  const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
  const sd = stddev(timings, mean);
  const min = Math.min(...timings);
  const max = Math.max(...timings);
  const med = median(timings);
  const p95 = percentile(timings, 95);
  const p99 = percentile(timings, 99);
  const avgSz = outputSizes.reduce((a, b) => a + b, 0) / outputSizes.length;
  const lastState = states[states.length - 1] ?? 'incomplete';

  console.log('\n' + '─'.repeat(72));
  console.log(`📊  ${scenario.name}`);
  console.log(
    `    URL   : .../${scenario.lang}/${scenario.seed}${scenario.moves.length ? '/' + scenario.moves.join('/') : ''}${scenario.monster ? '?monster=' + scenario.monster : ''}`
  );
  console.log(`    State : ${lastState}`);
  console.log('─'.repeat(72));
  console.log(`  min      ${fmt(min)}`);
  console.log(`  max      ${fmt(max)}`);
  console.log(`  mean     ${fmt(mean)}  ± ${sd.toFixed(2)} ms`);
  console.log(`  median   ${fmt(med)}`);
  console.log(`  p95      ${fmt(p95)}`);
  console.log(`  p99      ${fmt(p99)}`);
  if (avgSz > 0) console.log(`  output   ${(avgSz / 1024).toFixed(1)} KB WebP`);

  // Include render cache diagnostics
  console.log('  Render Cache Diagnostics:');
  console.log(`    Final Render Cache Size: ${renderOutputCache.size}`);

  // Distribution visuelle
  if (timings.length >= 3) {
    const range = max - min;
    const bucketSize = Math.max(
      5,
      Math.round(range / Math.min(10, timings.length))
    );
    const buckets = new Map<number, number>();
    for (const t of timings) {
      const b =
        Math.floor((t - min) / bucketSize) * bucketSize + Math.ceil(min);
      buckets.set(b, (buckets.get(b) ?? 0) + 1);
    }
    const maxCount = Math.max(...buckets.values());
    console.log('\n  Distribution :');
    for (const [bucket, count] of [...buckets.entries()].sort(
      (a, b) => a[0] - b[0]
    )) {
      const label = `${bucket.toFixed(0).padStart(7)}-${(bucket + bucketSize).toFixed(0).padStart(7)} ms`;
      console.log(`    ${label}  ${bar(count / maxCount)}  ${count}`);
    }
  }

  // Spans internes (si RENDER_PERF=1)
  if (reports.length > 0 && reports[0].spans.length > 0) {
    const spanTotals: Record<string, number[]> = {};
    for (const r of reports) {
      for (const s of r.spans) {
        spanTotals[s.label] ??= [];
        spanTotals[s.label].push(s.ms);
      }
    }
    const sorted = Object.entries(spanTotals)
      .map(([label, vals]) => ({
        label,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      .sort((a, b) => b.avg - a.avg);
    const total = sorted.reduce((a, s) => a + s.avg, 0);

    console.log('\n  Spans internes (moyenne) :');
    for (const { label, avg } of sorted) {
      const pct = total > 0 ? avg / total : 0;
      console.log(
        `    ${label.padEnd(24)} ${fmt(avg)}  ${bar(pct, 22)}  ${(pct * 100).toFixed(1)}%`
      );
    }

    // Cache hits du dernier run
    const lastReport = reports[reports.length - 1];
    const hits = Object.entries(lastReport.cacheHits).filter(
      ([, v]) => typeof v === 'boolean'
    );
    if (hits.length > 0) {
      console.log('\n  Cache hits (dernier run) :');
      for (const [key, hit] of hits) {
        console.log(`    ${key.padEnd(26)} ${hit ? '✅ HIT' : '❌ MISS'}`);
      }
    }
  }
}

// ─── Throughput estimator ─────────────────────────────────────────────────────

function printThroughput(allTimings: number[]): void {
  if (allTimings.length === 0) return;
  const mean = allTimings.reduce((a, b) => a + b, 0) / allTimings.length;
  const med = median(allTimings);
  const p95 = percentile(allTimings, 95);

  console.log('\n' + '═'.repeat(72));
  console.log(
    '🚀  Estimation de scalabilité (pipeline complet processGame + render)'
  );
  console.log('═'.repeat(72));
  console.log('');

  for (const [label, ms] of [
    ['mean', mean],
    ['median', med],
    ['p95', p95],
  ] as [string, number][]) {
    const rps = 1000 / ms;
    console.log(
      `  ${label.padEnd(8)} ${ms.toFixed(1).padStart(7)} ms/render` +
        `  →  ${rps.toFixed(1).padStart(6)} req/s` +
        `  ${(rps * 60).toFixed(0).padStart(6)} req/min` +
        `  ${((rps * 3600) / 1000).toFixed(0).padStart(5)}K req/h`
    );
  }

  console.log('');
  console.log('  💡 Cache chaud vs cold :');
  console.log(
    '     • Scénario "cache chaud" (même URL) : devrait être ~5-20× plus rapide.'
  );
  console.log(
    '     • Scénarios "seed aléatoire" : cold cache — représente le pire cas réel.'
  );
  console.log(
    '     • Pour scaler : Workers CF en parallèle + KV pour cache cross-isolat.'
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const getStr = (prefix: string, def: string) =>
    args
      .find(a => a.startsWith(prefix))
      ?.split('=')
      .slice(1)
      .join('=') ?? def;
  const getInt = (prefix: string, envKey: string, def: number) =>
    parseInt(getStr(prefix, process.env[envKey] ?? String(def)), 10);

  const RUNS = getInt('--runs=', 'BENCH_RUNS', 10);
  const WARMUP = getInt('--warmup=', 'BENCH_WARMUP', 2);
  const SEED = getStr('--seed=', makeSeed());
  const MONSTER = getStr('--monster=', '') || undefined;

  console.log('═'.repeat(72));
  console.log('🎮  Konosuba RPG — Benchmark pipeline complet');
  console.log('    (processUrl → processGame → renderImage, aucun mock)');
  console.log('═'.repeat(72));
  console.log(`  Runs      : ${RUNS} mesurés + ${WARMUP} warmup ignorés`);
  console.log(`  Seed fixe : ${SEED}`);
  console.log(`  Monster   : ${MONSTER ?? '(aléatoire selon seed)'}`);
  console.log(
    `  Spans     : ${process.env.RENDER_PERF === '1' ? '✅ activés' : '❌ désactivés — lancez avec RENDER_PERF=1'}`
  );
  console.log(`  Date      : ${new Date().toISOString()}`);

  const scenarios = buildScenarios(SEED, MONSTER);
  const allTimings: number[] = [];

  for (const scenario of scenarios) {
    const url = buildUrl(
      scenario.seed,
      scenario.moves,
      scenario.lang,
      scenario.monster
    );
    process.stdout.write(`\n⏳  ${scenario.name} ...`);
    try {
      const result = await runScenario(scenario, RUNS, WARMUP);
      process.stdout.write(' done\n');
      allTimings.push(...result.timings);
      printScenarioReport(scenario, url, result);
    } catch (err) {
      process.stdout.write(' ❌ ERREUR\n');
      console.error(`    ${String(err)}`);
    }
  }

  printThroughput(allTimings);

  console.log('\n' + '─'.repeat(72));
  console.log('🗃️  État des caches en fin de benchmark :');
  for (const [k, v] of Object.entries(getCacheDiagnostics())) {
    console.log(`  ${k.padEnd(28)} ${v}`);
  }
  console.log('─'.repeat(72));
  console.log('✅  Benchmark terminé.\n');
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
