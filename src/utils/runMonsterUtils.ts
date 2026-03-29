import { Random } from '../classes/Random';
import { generateMob } from '../objects/data/mobMap';
import { extractMonster, isTraining } from './payloadUtils';

function seedFromRunId(runId: string): number {
  const normalized = runId.toLowerCase();
  let seed = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    seed = (seed + normalized.charCodeAt(i)) % 8096;
  }

  return seed;
}

export function extractPayloadFromRunKey(runKey: string): string | null {
  const separatorIndex = runKey.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }

  const payload = runKey.slice(separatorIndex + 1);
  return payload || null;
}

export function inferMonsterFromPayload(payload: string): string | null {
  if (!payload) {
    return null;
  }

  if (isTraining(payload)) {
    return extractMonster(payload);
  }

  const slashIndex = payload.indexOf('/');
  const runId = (slashIndex === -1 ? payload : payload.slice(0, slashIndex)).trim();
  if (!runId) {
    return null;
  }

  const rand = new Random(seedFromRunId(runId));
  const mob = rand.choice(generateMob());
  return mob?.name?.[0] || mob?.constructor?.name || null;
}

export function inferMonsterFromRunKey(runKey: string): string | null {
  const payload = extractPayloadFromRunKey(runKey);
  if (!payload) {
    return null;
  }

  return inferMonsterFromPayload(payload);
}
