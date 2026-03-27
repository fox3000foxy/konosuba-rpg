export class Random {
  private seed: number;
  private S: number[];
  private i: number;
  private j: number;

  constructor(seed: number) {
    this.seed = seed;
    this.S = Array.from({ length: 256 }, (_, i) => i);
    this.i = 0;
    this.j = 0;

    for (let i = 0, j = 0; i < 256; i++) {
      j = (j + this.S[i] + (seed & 0xff)) % 256;
      [this.S[i], this.S[j]] = [this.S[j], this.S[i]];
      seed >>= 8;
    }
  }

  next(): number {
    this.i = (this.i + 1) % 256;
    this.j = (this.j + this.S[this.i]) % 256;
    [this.S[this.i], this.S[this.j]] = [this.S[this.j], this.S[this.i]];
    return this.S[(this.S[this.i] + this.S[this.j]) % 256] / 256;
  }

  randint(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}
