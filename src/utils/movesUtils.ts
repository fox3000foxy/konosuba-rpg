/** Utility functions for moves compression and decompression */

/** Compresses a string of moves */
export function compressMoves(moves: string): string {
  let result = '';
  let count = 1;

  for (let i = 1; i <= moves.length; i++) {
    if (moves[i] === moves[i - 1]) {
      count++;
    } else {
      result += moves[i - 1] + (count > 1 ? count : '');
      count = 1;
    }
  }

  return result;
}

/** Decompresses a compressed string of moves */
export function decompressMoves(comp: string): string {
  // eslint-disable-next-line security/detect-unsafe-regex
  return comp.replace(/([a-z])(\d+)?/g, (_, char, num) => {
    return char.repeat(num ? parseInt(num) : 1);
  });
}