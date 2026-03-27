import { Context } from 'hono';
import { GenericCreature } from '../../classes/GenericCreature';
import { Random } from '../../classes/Random';
import { generateMob } from '../../objects/data/mobMap';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import { pascalCaseToString } from '../../utils/processGame';

export async function handleInfosMonsterCommand(c: Context, fr: boolean, options: InteractionDataOption[]) {
    const commandMonster = options.find((o) => o.name === 'monster')?.value;
    const monsterCandidate = typeof commandMonster === 'string' ? commandMonster.trim().toLowerCase() : '';
    // const monsterKey = Object.keys(generateMob()).find((k) => k.toLowerCase() === monsterCandidate);
    const mobs = generateMob();
    console.log(`Looking for monster key matching candidate "${monsterCandidate}" among ${mobs.length} mobs...`);
    const monsterKey = mobs.find(m => m.name.toLowerCase() === monsterCandidate);
    if (!monsterKey) {
        // const allMobs = Object.keys(generateMob()).sort();
        const allMobs = mobs.map(m => m.name || m.constructor.name || pascalCaseToString(m.constructor.name)).sort();
        return c.json({
            type: 4,
            data: {
                embeds: [{
                    description: fr
                        ? `Ce monstre est invalide. Voici les monstres valides: ${allMobs.join(', ')}`
                        : `Invalid monster. Valid monsters: ${allMobs.join(', ')}`,
                }],
            },
        });
    }

    console.log(`Monster key `, monsterKey, ` found for candidate "${monsterCandidate}". Retrieving monster data...`);
    const monster = mobs.find(m => m.name.toLowerCase() === monsterCandidate);
    if (!monster) {
        return c.json({
            type: 4,
            data: {
                embeds: [{
                    description: fr
                        ? `Erreur lors de la récupération des données du monstre.`
                        : `Error retrieving monster data.`,
                }],
            },
        });
    }

    //   const imgUrl = `${BASE_URL}/konosuba-rpg/assets/${monster.images[0]}`;
    if (monster instanceof GenericCreature) {
        const rand = new Random(1);
        monster.pickColor(rand);
    }
    const imgUrl = `https://raw.githubusercontent.com/fox3000foxy/konosuba-rpg/refs/heads/main/assets/mobs/${monster.images[0]}.webp`;
    
    return c.json({
        type: 4,
        data: {
            embeds: [{
                description: fr
                    ? `# Informations de monstre:\n\n**Nom**: ${monster.name}\n**PV**: ${monster.hp} PV\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} points de dégâts.\n**LP**: ${monster.love !== 100 ? monster.love + ' points d\'amour' : 'Ne peut pas être ami'}`
                    : `# Monster infos:\n\n**Name**: ${monster.name}\n**HP**: ${monster.hp} HP\n**ATK**: ${monster.attack[0]}-${monster.attack[1]} damage points.\n**LP**: ${monster.love !== 100 ? monster.love + ' love points' : 'Can\'t be friends'}`,
                image: { url: imgUrl },
                color: 0x2b2d31,
            }],
        },
    });
}