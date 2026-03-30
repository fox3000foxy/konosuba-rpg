import { Context } from 'hono';
import { Interaction } from '../../objects/enums/Interaction';
import { MonsterDifficulty } from '../../objects/enums/MonsterDifficulty';
import { QuestAction } from '../../objects/enums/QuestAction';
import { QuestKey } from '../../objects/enums/QuestKey';
import { getMonsterCatalog } from '../commands/infos-monster';

const PLAYER_AUTOCOMPLETE_CHOICES = [
  { name: 'Kazuma', value: 0 },
  { name: 'Darkness', value: 1 },
  { name: 'Megumin', value: 2 },
  { name: 'Aqua', value: 3 },
];

const DIFFICULTY_AUTOCOMPLETE_CHOICES = [
  { name: 'Easy', value: MonsterDifficulty.Easy },
  { name: 'Medium', value: MonsterDifficulty.Medium },
  { name: 'Hard', value: MonsterDifficulty.Hard },
  { name: 'Very Hard', value: MonsterDifficulty.VeryHard },
  { name: 'Extreme', value: MonsterDifficulty.Extreme },
  { name: 'Legendary', value: MonsterDifficulty.Legendary },
];

export function handleAutocomplete(c: Context, interaction: Interaction, fr: boolean) {
  if (interaction.data?.name === 'quest') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'action') {
      const actions = [QuestAction.View, QuestAction.Claim]
        .filter(action => action.includes(focusedValue))
        .slice(0, 25)
        .map(action => ({ name: action, value: action }));

      return c.json({ type: 8, data: { choices: actions } });
    }

    if (focused?.name === 'quest_id') {
      const questKeys = Object.values(QuestKey)
        .filter(key => key.includes(focusedValue))
        .slice(0, 25)
        .map(key => ({ name: key, value: key }));

      return c.json({ type: 8, data: { choices: questKeys } });
    }
  }

  if (interaction.data?.name === 'infos-player') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'character') {
      const choices = PLAYER_AUTOCOMPLETE_CHOICES
        .filter(choice => {
          const byName = choice.name.toLowerCase().includes(focusedValue);
          const byId = String(choice.value).includes(focusedValue);
          return byName || byId;
        })
        .slice(0, 25);

      return c.json({ type: 8, data: { choices } });
    }
  }

  if (interaction.data?.name === 'infos-monster') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'monster') {
      const choices = getMonsterCatalog(fr)
        .filter(monster => monster.name.toLowerCase().includes(focusedValue))
        .slice(0, 25)
        .map(monster => ({ name: monster.name, value: monster.id }));

      return c.json({ type: 8, data: { choices } });
    }
  }

  if (interaction.data?.name === 'start') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'difficulty') {
      const choices = DIFFICULTY_AUTOCOMPLETE_CHOICES
        .filter(choice => {
          const byName = choice.name.toLowerCase().includes(focusedValue);
          const byValue = choice.value.toLowerCase().includes(focusedValue);
          return byName || byValue;
        })
        .slice(0, 25);

      return c.json({ type: 8, data: { choices } });
    }
  }

  return c.json({ type: 8, data: { choices: [] } });
}