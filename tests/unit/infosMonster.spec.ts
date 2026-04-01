import {
    generateMonsterInfos,
    generateMonsterInfosByConstructorName,
    getMonsterCatalog,
} from '../../src/interactionReplies/commands/infos-monster';

describe('monster infos command', () => {
  it('uses stable constructor-based ids in the catalog', () => {
    const catalog = getMonsterCatalog(false);

    expect(catalog.find(monster => monster.name === 'Dragon')?.id).toBe('Dragon');
    expect(catalog.find(monster => monster.name === 'King Troll')?.id).toBe('KingTroll');
  });

  it('keeps generic monster info deterministic across calls', () => {
    const dateSpy = jest.spyOn(Date, 'now');

    dateSpy.mockReturnValueOnce(1_000_000).mockReturnValueOnce(2_000_000);

    const first = generateMonsterInfos('Dragon', false);
    const second = generateMonsterInfos('Dragon', false);

    expect(first.command.data.embeds[0].image?.url).toBe(second.command.data.embeds[0].image?.url);
    expect(first.command.data.embeds[0].description).toBe(second.command.data.embeds[0].description);
    expect(first.creature?.color).toBe(second.creature?.color);

    dateSpy.mockRestore();
  });

  it('resolves constructor names directly for monster infos by constructor name', () => {
    const infos = generateMonsterInfosByConstructorName('KingTroll', false);

    expect(infos.creature?.name[0]).toBe('King Troll');
    expect(infos.command.data.embeds[0].description).toContain('King Troll');
  });
});