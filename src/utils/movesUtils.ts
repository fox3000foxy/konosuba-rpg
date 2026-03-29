/** Utility functions for moves compression and decompression */

/** Compresses a string of moves */
export function compressMoves(moves: string): string {
  if (moves.length < 2) {
    return moves;
  }

  let result = '';
  let count = 1;

  for (let i = 1; i <= moves.length; i += 1) {
    if (moves[i] === moves[i - 1]) {
      count += 1;
    } else {
      result += moves[i - 1] + (count > 1 ? String(count) : '');
      count = 1;
    }
  }

  return result;
}

/** Decompresses a compressed string of moves */
export function decompressMoves(comp: string): string {
  let result = '';
  let i = 0;

  while (i < comp.length) {
    const char = comp[i];
    i += 1;

    let count = 0;
    while (i < comp.length && comp[i] >= '0' && comp[i] <= '9') {
      count = count * 10 + (comp.charCodeAt(i) - 48);
      i += 1;
    }

    result += char.repeat(count > 0 ? count : 1);
  }

  return result;
}
