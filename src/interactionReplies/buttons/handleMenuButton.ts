import { Context } from 'hono';
import { Lang } from '../../objects/enums/Lang';
import { RawButton } from '../../objects/enums/RawButton';
import { buildBattleTitle } from '../../utils/battleTitle';
import {
  buildComponents,
  getBattleMonsterNames,
} from '../../utils/componentsBuilder';
import { makeid } from '../../utils/idUtils';
import { buildImageUrl } from '../../utils/imageUtils';
import {
  generateMonsterInfosByConstructorName,
  getMonsterCatalog,
} from '../commands/infos-monster';
import { generatePlayerInfos } from '../commands/infos-player';

const MONSTERS_PAGE_SIZE = 5;

function menuHomeComponents(userID: string, fr: boolean): RawButton[] {
  const owner = `:${userID}`;

  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: fr ? 'Jouer maintenant' : 'Play now',
          custom_id: `menu.start${owner}`,
        },
        {
          type: 2,
          style: 1,
          label: fr ? 'Train Troll' : 'Train Troll',
          custom_id: `menu.train.troll${owner}`,
        },
        {
          type: 2,
          style: 1,
          label: fr ? 'Train aleatoire' : 'Random train',
          custom_id: `menu.train.random${owner}`,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: fr ? 'Infos persos' : 'Player infos',
          custom_id: `menu.players${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: fr ? 'Infos monstres' : 'Monster infos',
          custom_id: `menu.monsters${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: fr ? 'Aide' : 'Help',
          custom_id: `menu.help${owner}`,
        },
      ],
    },
  ];
}

function playerMenuComponents(userID: string, fr: boolean): RawButton[] {
  const owner = `:${userID}`;

  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: 'Kazuma',
          custom_id: `menu.player.0${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: 'Darkness',
          custom_id: `menu.player.1${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: 'Megumin',
          custom_id: `menu.player.2${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: 'Aqua',
          custom_id: `menu.player.3${owner}`,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 1,
          label: fr ? 'Retour menu' : 'Back to menu',
          custom_id: `menu.home${owner}`,
        },
      ],
    },
  ];
}

function monsterMenuComponents(
  userID: string,
  fr: boolean,
  page: number
): RawButton[] {
  const owner = `:${userID}`;
  const catalog = getMonsterCatalog(fr).map(item => ({
    ...item,
    name:
      typeof item.name === 'string' && item.name.trim().length > 0
        ? item.name.trim()
        : item.id,
  }));
  const totalPages = Math.max(
    1,
    Math.ceil(catalog.length / MONSTERS_PAGE_SIZE)
  );
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * MONSTERS_PAGE_SIZE;
  const pageItems = catalog.slice(start, start + MONSTERS_PAGE_SIZE);
  console.log(
    `Displaying monsters page ${safePage + 1}/${totalPages} (items ${start + 1}-${start + pageItems.length} of ${catalog.length})`
  );

  const monsterRows: RawButton[] = [];
  for (let i = 0; i < pageItems.length; i += 5) {
    monsterRows.push({
      type: 1,
      components: pageItems.slice(i, i + 5).map(item => ({
        type: 2,
        style: 2,
        label: item.name.slice(0, 80),
        custom_id: `menu.monster.id.${item.id}${owner}`,
      })),
    });
  }

  return [
    ...monsterRows,
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: fr ? 'Precedent' : 'Previous',
          custom_id: `menu.monsters.page.${Math.max(0, safePage - 1)}${owner}`,
          disabled: safePage === 0,
        },
        {
          type: 2,
          style: 2,
          label: `${safePage + 1}/${totalPages}`,
          custom_id: `menu.monsters.current.${safePage}${owner}`,
          disabled: true,
        },
        {
          type: 2,
          style: 2,
          label: fr ? 'Suivant' : 'Next',
          custom_id: `menu.monsters.page.${Math.min(totalPages - 1, safePage + 1)}${owner}`,
          disabled: safePage >= totalPages - 1,
        },
        {
          type: 2,
          style: 1,
          label: fr ? 'Monstre aleatoire' : 'Random monster',
          custom_id: `menu.monster.random${owner}`,
        },
        {
          type: 2,
          style: 1,
          label: fr ? 'Retour menu' : 'Back to menu',
          custom_id: `menu.home${owner}`,
        },
      ],
    },
  ];
}

function baseMenuEmbed(fr: boolean) {
  return {
    description: fr
      ? '# Menu RPG\n\nChoisis une action pour lancer une partie rapidement ou consulter des infos.'
      : '# RPG Menu\n\nChoose an action to quickly start a game or inspect data.',
    color: 0x2b2d31,
  };
}

function resolveMonsterName(monsterIdentifier: string, fr: boolean): string {
  const info = generateMonsterInfosByConstructorName(monsterIdentifier, fr);
  if (!info.creature) {
    return fr ? 'Troll' : 'Troll';
  }

  return getBattleMonsterNames(info.creature, fr ? Lang.French : Lang.English)
    .displayName;
}

async function buildStartData(userID: string, lang: Lang, fr: boolean) {
  const id = makeid(15);
  const imageUrl = buildImageUrl(id, lang, undefined, userID);
  const { embedDescription, buttons } = await buildComponents(id, userID, lang);

  return {
    embeds: [
      {
        image: { url: imageUrl },
        description:
          (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`) +
          (embedDescription.length > 0
            ? `\n\n${embedDescription.join('\n')}`
            : ''),
        color: 0x2b2d31,
      },
    ],
    components: buttons,
  };
}

async function buildTrainData(
  userID: string,
  lang: Lang,
  fr: boolean,
  monsterIdentifier: string
) {
  const monsterName = resolveMonsterName(monsterIdentifier, fr);
  const payload = `train.${monsterName}.${makeid(10)}`;
  const imageUrl = buildImageUrl(payload, lang);
  const { embedDescription, buttons } = await buildComponents(
    payload,
    userID,
    lang
  );
  const title = buildBattleTitle(payload, fr, userID, monsterName);

  return {
    embeds: [
      {
        image: { url: imageUrl },
        description:
          `${title} ${fr ? `(joueur <@${userID}>)` : `(player <@${userID}>)`}` +
          (embedDescription.length > 0
            ? `\n\n${embedDescription.join('\n')}`
            : ''),
        color: 0x2b2d31,
      },
    ],
    components: buttons,
  };
}

export async function handleMenuButton(
  c: Context,
  menuAction: string,
  userID: string,
  lang: Lang,
  fr: boolean
) {
  if (menuAction === 'menu.home') {
    return c.json({
      type: 7,
      data: {
        embeds: [baseMenuEmbed(fr)],
        components: menuHomeComponents(userID, fr),
      },
    });
  }

  console.log('Handling menu action:', menuAction);

  if (menuAction.startsWith('menu.start')) {
    return c.json({ type: 7, data: await buildStartData(userID, lang, fr) });
  }

  if (menuAction.startsWith('menu.players')) {
    return c.json({
      type: 7,
      data: {
        embeds: [
          {
            description: fr
              ? '# Infos personnages\n\nChoisis un personnage pour voir ses stats et son lore.'
              : '# Player infos\n\nChoose a character to inspect stats and lore.',
            color: 0x2b2d31,
          },
        ],
        components: playerMenuComponents(userID, fr),
      },
    });
  }

  if (menuAction.startsWith('menu.monsters.page.')) {
    const rawPage = Number(menuAction.slice('menu.monsters.page.'.length));
    const page = Number.isFinite(rawPage) ? rawPage : 0;

    return c.json({
      type: 7,
      data: {
        embeds: [
          {
            description: fr
              ? '# Infos monstres\n\nChoisis un monstre pour voir sa fiche. Navigation par pages.'
              : '# Monster infos\n\nChoose a monster to inspect stats and lore. Browse with pages.',
            color: 0x2b2d31,
          },
        ],
        components: monsterMenuComponents(userID, fr, page),
      },
    });
  }

  if (menuAction === 'menu.monsters') {
    const page = 0;
    return c.json({
      type: 7,
      data: {
        embeds: [
          {
            description: fr
              ? '# Infos monstres\n\nChoisis un monstre pour voir sa fiche. Navigation par pages.'
              : '# Monster infos\n\nChoose a monster to inspect stats and lore. Browse with pages.',
            color: 0x2b2d31,
          },
        ],
        components: monsterMenuComponents(userID, fr, page),
      },
    });
  }

  if (menuAction === 'menu.help') {
    return c.json({
      type: 7,
      data: {
        embeds: [
          {
            description: fr
              ? '# Aide rapide\n\n- Utilise **Jouer maintenant** pour une partie complete.\n- Utilise **Train** pour farmer contre un monstre cible.\n- Les fiches persos/monstres sont la pour preparer les combats.'
              : '# Quick help\n\n- Use **Play now** for a full game loop.\n- Use **Train** to practice against a focused target.\n- Player/monster cards help you prepare your strategy.',
            color: 0x2b2d31,
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: fr ? 'Retour menu' : 'Back to menu',
                custom_id: `menu.home:${userID}`,
              },
            ],
          },
        ],
      },
    });
  }

  if (menuAction.startsWith('menu.player.')) {
    const id = Number(menuAction.slice('menu.player.'.length));
    const player = generatePlayerInfos(fr, id);

    return c.json({
      type: 7,
      data: {
        ...player.command.data,
        components: playerMenuComponents(userID, fr),
      },
    });
  }

  if (menuAction === 'menu.monster.random') {
    const catalog = getMonsterCatalog(fr);
    if (catalog.length === 0) {
      return c.json({
        type: 7,
        data: {
          embeds: [
            {
              description: fr
                ? '# Infos monstres\n\nAucun monstre disponible pour le moment.'
                : '# Monster infos\n\nNo monsters are currently available.',
              color: 0x2b2d31,
            },
          ],
          components: monsterMenuComponents(userID, fr, 0),
        },
      });
    }
    const randomMonster = catalog[Math.floor(Math.random() * catalog.length)];
    const info = generateMonsterInfosByConstructorName(randomMonster.id, fr);

    return c.json({
      type: 7,
      data: {
        ...info.command.data,
        components: monsterMenuComponents(userID, fr, 0),
      },
    });
  }

  if (menuAction.startsWith('menu.monster.id.')) {
    const monsterId = menuAction.slice('menu.monster.id.'.length);
    const info = generateMonsterInfosByConstructorName(monsterId, fr);

    return c.json({
      type: 7,
      data: {
        ...info.command.data,
        components: monsterMenuComponents(userID, fr, 0),
      },
    });
  }

  if (menuAction.startsWith('menu.monster.')) {
    const legacyMonsterIdentifier = menuAction.slice('menu.monster.'.length);
    const info = generateMonsterInfosByConstructorName(
      legacyMonsterIdentifier,
      fr
    );

    return c.json({
      type: 7,
      data: {
        ...info.command.data,
        components: monsterMenuComponents(userID, fr, 0),
      },
    });
  }

  if (menuAction === 'menu.train.random') {
    const catalog = getMonsterCatalog(fr);
    if (catalog.length === 0) {
      return c.json({
        type: 7,
        data: {
          embeds: [
            {
              description: fr
                ? '# Menu RPG\n\nAucun monstre disponible pour lancer un entrainement.'
                : '# RPG Menu\n\nNo monsters are available to start training.',
              color: 0x2b2d31,
            },
          ],
          components: menuHomeComponents(userID, fr),
        },
      });
    }
    const randomMonster = catalog[Math.floor(Math.random() * catalog.length)];
    return c.json({
      type: 7,
      data: await buildTrainData(userID, lang, fr, randomMonster.id),
    });
  }

  if (menuAction === 'menu.train.troll') {
    return c.json({
      type: 7,
      data: await buildTrainData(userID, lang, fr, 'troll'),
    });
  }

  if (menuAction.startsWith('menu.train.')) {
    const monsterIdentifier = menuAction.slice('menu.train.'.length);
    return c.json({
      type: 7,
      data: await buildTrainData(userID, lang, fr, monsterIdentifier),
    });
  }

  return c.json({
    type: 7,
    data: {
      embeds: [baseMenuEmbed(fr)],
      components: menuHomeComponents(userID, fr),
    },
  });
}
