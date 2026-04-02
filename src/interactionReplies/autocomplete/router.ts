import { Context } from 'hono';
import { Interaction } from '../../objects/enums/Interaction';
import { MonsterDifficulty } from '../../objects/enums/MonsterDifficulty';
import { QuestAction } from '../../objects/enums/QuestAction';
import { getItems as getAccessoryItems } from '../../services/accessoryService';
import { getItems as getConsumableItems } from '../../services/consumableService';
import { getCraftingRecipes } from '../../services/craftService';
import { getQuestLabel, QUESTS } from '../../services/progressionService';
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

export function handleAutocomplete(
  c: Context,
  interaction: Interaction,
  fr: boolean
) {
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
      const questChoices = QUESTS.filter(quest => {
        const label = getQuestLabel(quest.key, fr).toLowerCase();
        return label.includes(focusedValue);
      })
        .slice(0, 25)
        .map(quest => ({
          name: getQuestLabel(quest.key, fr),
          value: quest.key,
        }));

      return c.json({ type: 8, data: { choices: questChoices } });
    }
  }

  if (interaction.data?.name === 'infos-player') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'character') {
      const choices = PLAYER_AUTOCOMPLETE_CHOICES.filter(choice => {
        const byName = choice.name.toLowerCase().includes(focusedValue);
        const byId = String(choice.value).includes(focusedValue);
        return byName || byId;
      }).slice(0, 25);

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

  if (interaction.data?.name === 'shop') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'action') {
      const actionChoices = ['items', 'buy', 'sell']
        .filter(a => a.startsWith(focusedValue))
        .slice(0, 25)
        .map(a => ({ name: a, value: a }));

      return c.json({ type: 8, data: { choices: actionChoices } });
    }

    if (focused?.name === 'format') {
      const formatChoices = ['text', 'image']
        .filter(a => a.startsWith(focusedValue))
        .slice(0, 25)
        .map(a => ({ name: a, value: a }));

      return c.json({ type: 8, data: { choices: formatChoices } });
    }

    if (focused?.name === 'item') {
      const accessoryChoices = getAccessoryItems().map(item => ({
        name: item.nameFr || item.id,
        value: item.id,
      }));
      const consumableChoices = getConsumableItems().map(item => ({
        name: item.nameFr || item.id,
        value: item.id,
      }));
      const allChoices = [...accessoryChoices, ...consumableChoices]
        .filter(choice =>
          choice.name.toLowerCase().includes(focusedValue) ||
          String(choice.value).toLowerCase().includes(focusedValue)
        )
        .slice(0, 25);

      return c.json({ type: 8, data: { choices: allChoices } });
    }
  }

  if (interaction.data?.name === 'craft') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'recipe') {
      const recipes = getCraftingRecipes();
      const choices = recipes
        .filter(recipe => {
          const recipeName = (
            fr ? recipe.resultNameFr : recipe.resultNameEn
          ).toLowerCase();
          return recipeName.includes(focusedValue);
        })
        .slice(0, 25)
        .map(recipe => ({
          name: fr ? recipe.resultNameFr : recipe.resultNameEn,
          value: recipe.key,
        }));

      return c.json({ type: 8, data: { choices } });
    }
  }

  if (interaction.data?.name === 'start') {
    const options = interaction.data.options || [];
    const focused = options.find(option => option.focused);
    const focusedValue = String(focused?.value || '').toLowerCase();

    if (focused?.name === 'difficulty') {
      const choices = DIFFICULTY_AUTOCOMPLETE_CHOICES.filter(choice => {
        const byName = choice.name.toLowerCase().includes(focusedValue);
        const byValue = choice.value.toLowerCase().includes(focusedValue);
        return byName || byValue;
      }).slice(0, 25);

      return c.json({ type: 8, data: { choices } });
    }
  }

  return c.json({ type: 8, data: { choices: [] } });
}
