import * as esbuild from 'esbuild';
import path from 'node:path';

async function buildInputs(entryFile: string): Promise<string[]> {
  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    target: ['node18'],
    minify: true,
    treeShaking: true,
    write: false,
    metafile: true,
  });

  const metafile = result.metafile as { inputs: Record<string, unknown> };
  return Object.keys(metafile.inputs);
}

function hasInput(inputs: string[], suffix: string): boolean {
  return inputs.some(input => input.endsWith(suffix));
}

describe('vercel bundle split', () => {
  it('keeps light bundle free of render pipeline and progression imports', async () => {
    const inputs = await buildInputs(path.join(__dirname, '../../src/light.ts'));

    expect(hasInput(inputs, 'src/routes/gameLight.ts')).toBe(true);
    expect(hasInput(inputs, 'src/services/gameLightService.ts')).toBe(true);
    expect(hasInput(inputs, 'src/services/gameSerializer.ts')).toBe(true);

    expect(hasInput(inputs, 'src/services/gameRenderService.ts')).toBe(false);
    expect(hasInput(inputs, 'src/services/progressionService.ts')).toBe(false);
    expect(hasInput(inputs, 'src/utils/renderImage.ts')).toBe(false);
    expect(hasInput(inputs, 'src/routes/apiRender.ts')).toBe(false);
  });

  it('keeps battle render bundle separate from pages routes', async () => {
    const inputs = await buildInputs(path.join(__dirname, '../../src/render.ts'));

    expect(hasInput(inputs, 'src/routes/rpg.ts')).toBe(true);
    expect(hasInput(inputs, 'src/services/gameRenderService.ts')).toBe(true);
    expect(hasInput(inputs, 'src/utils/renderImage.ts')).toBe(true);

    expect(hasInput(inputs, 'src/routes/apiRender.ts')).toBe(false);
    expect(hasInput(inputs, 'src/services/gameLightService.ts')).toBe(false);
  });
});
