const lines = {
  fr: {
    youAttackMsgs: [
      [
        // Kazuma — roublard, calculateur, rarement courageux
        "Kazuma vole l'équipement du **CREATURE** pendant le combat et lui inflige **DAMAGE** dégâts au passage.",
        "Kazuma attend que le **CREATURE** soit distrait, puis tire une flèche dans le dos et inflige **DAMAGE** dégâts. 'C'est pas de la lâcheté, c'est de la stratégie.'",
        "Kazuma utilise Drain Touch sur le **CREATURE** et lui vole **DAMAGE** points de vie. 'Merci pour les PV.'",
      ],
      [
        // Darkness — masochiste, chevaleresque, rate tout
        "Darkness charge héroïquement le **CREATURE** en criant 'Frappez-moi !', rate complètement, mais inflige quand même **DAMAGE** dégâts par pur accident.",
        "Darkness attaque le **CREATURE** avec une noble ardeur… et manque. Sa deuxième tentative inflige **DAMAGE** dégâts. Elle a l'air déçue de ne pas avoir reçu de coup.",
        "Darkness frappe le **CREATURE** et inflige **DAMAGE** dégâts. 'C'est tout ? Elle ne m'a même pas touchée… quelle tristesse.'",
      ],
      [
        // Megumin — obsédée par l'explosion, un seul sort, théâtrale
        "Megumin déclame son incantation pendant trois minutes, lève son bâton vers le ciel et déclenche une Explosion dévastatrice sur le **CREATURE** pour **DAMAGE** dégâts. Elle s'effondre aussitôt.",
        "Megumin refuse d'utiliser quoi que ce soit d'autre qu'Explosion. Le **CREATURE** prend **DAMAGE** dégâts. Megumin doit être portée pour le reste de la journée.",
        "'Il n'existe qu'une seule magie !' Megumin invoque une Explosion sur le **CREATURE** pour **DAMAGE** dégâts et tombe immédiatement à genoux, épuisée. Elle sourit quand même.",
      ],
      [
        // Aqua — déesse inutile, efficace uniquement contre les morts-vivants
        "Aqua utilise God Requiem sur le **CREATURE** et inflige **DAMAGE** dégâts. 'Tu vois ? Je suis utile !'",
        'Aqua lance Aqua Beam sur le **CREATURE** et inflige **DAMAGE** dégâts, puis réclame immédiatement des louanges.',
        "Aqua invoque le jugement divin sur le **CREATURE** pour **DAMAGE** dégâts. 'Kazuma, tu as vu ? Note-le quelque part !'",
      ],
    ],
    youDefendMsgs: [
      [
        // Kazuma
        "Kazuma se cache derrière Darkness en murmurant 'c'est pour ça qu'on l'a recrutée'.",
        "Kazuma utilise Ambush et disparaît dans l'ombre, laissant ses alliés gérer.",
        'Kazuma invoque un grand bouclier, se met à couvert, et crie des encouragements depuis sa cachette.',
      ],
      [
        // Darkness
        "Darkness se plante devant l'ennemi, écarte les bras et supplie : 'Frappez-moi ! Je peux tout encaisser !'",
        "Darkness adopte une posture défensive absolument imprenable… et rate quand même tous les coups qu'elle essaie de parer. Elle a l'air ravie.",
        "Darkness couvre l'équipe de son corps. 'Aucun coup ne me fait peur !' Elle semble sincèrement impatiente d'en prendre un.",
      ],
      [
        // Megumin
        'Megumin est déjà à terre après son explosion. Elle se défend en ne pouvant de toute façon pas bouger.',
        "Megumin lève son bâton d'une main tremblante. 'Je peux encore me battre !' Elle ne peut clairement pas.",
        "Megumin tente une posture défensive, mais quelqu'un doit la tenir debout. Elle s'en fiche — sa dignité est intacte.",
      ],
      [
        // Aqua
        'Aqua invoque un Mur Sacré… qui se dissout en quelques secondes. Elle jure que ça a marché la dernière fois.',
        'Aqua ferme les yeux et prie très fort. Étrangement, ça semble fonctionner à moitié.',
        'Aqua se cache derrière Kazuma et décrète que les dieux ne font pas le sale boulot.',
      ],
    ],
    youHugMsgs: [
      ['Kazuma fait un câlin au **CREATURE** avec un sourire suspect. Il lui a sûrement volé quelque chose.', "Kazuma serre le **CREATURE** dans ses bras. 'Tu sais, t'es pas si terrible.' Il vérifie ses poches après.", 'Kazuma enlace le **CREATURE**. Darkness est jalouse. Aqua est dégoûtée. Megumin ne lève pas les yeux de son grimoire.'],
      ["Darkness étreint le **CREATURE** avec une ferveur chevaleresque. 'Je protégerai même mes ennemis !' Le **CREATURE** a l'air déstabilisé.", "Darkness serre le **CREATURE** très fort contre elle. 'Tu peux résister si tu veux.' Il ne résiste pas. Elle est déçue.", "Darkness fait un câlin au **CREATURE** en lui murmurant une prière. Kazuma soupire depuis l'arrière-plan."],
      ["Megumin pose son bâton et enlace le **CREATURE** avec une solennité inattendue. 'Même les ennemis méritent l'Explosion de l'amour.'", "Megumin fait un câlin au **CREATURE**, les yeux fermés, très sérieusement. Elle appelle ça 'le rituel de réconciliation'. Personne ne la contredit.", "Megumin serre le **CREATURE** dans ses bras. 'Sois honoré — je ne fais ça qu'une fois par jour. Et j'ai déjà utilisé mon Explosion.'"],
      ["Aqua fait un câlin au **CREATURE** en pleurant. 'Même les monstres ont une âme !' Elle pleure vraiment beaucoup.", 'Aqua enlace le **CREATURE** avec générosité divine. Elle lui fait passer un bénéfice de purification dans la foulée. Non demandé.', "Aqua serre le **CREATURE** dans ses bras, puis réclame que Kazuma l'ait ordonné pour éviter de perdre la face."],
    ],
    aquaHealMsgs: ["Aqua soigne l'équipe de 15 PV, puis exige des remerciements formels et une mention de son titre de déesse.", "Aqua invoque ses pouvoirs divins et restaure 15 PV. 'Vous voyez ? Indispensable. Notez-le.' Personne ne note.", "Aqua pleure un peu, prie beaucoup, et finit par soigner l'équipe de 15 PV. 'Je veux du saké ce soir.'"],
    youSpecialAttackMsgs: [
      [
        // Kazuma
        "Kazuma active Tir Ciblé, vise méthodiquement le point faible du **CREATURE** et inflige **DAMAGE** dégâts. 'J'ai quand même des compétences utiles, bande d'ingrats.'",
        'Kazuma déclenche sa compétence spéciale sur le **CREATURE** pour **DAMAGE** dégâts. Il a attendu le bon moment — dix minutes. Ça valait le coup.',
        "Kazuma utilise Steal Super Charge sur le **CREATURE**, lui inflige **DAMAGE** dégâts et lui vole son arme dans le même mouvement. 'Bonus.'",
      ],
      [
        // Darkness
        'Darkness active Divine Slash et inflige **DAMAGE** dégâts au **CREATURE**. Elle fronce les sourcils — elle espérait en recevoir autant en retour.',
        "Darkness déchaîne son attaque spéciale sur le **CREATURE** pour **DAMAGE** dégâts. 'C'est tout ? Où est le danger ? Où est la DOULEUR ?'",
        "Darkness frappe le **CREATURE** avec une technique chevaleresque secrète et inflige **DAMAGE** dégâts. Elle avait l'air de vouloir rater, mais ça a marché quand même.",
      ],
      [
        // Megumin
        "Megumin déploie sa magie ultime — une deuxième Explosion. **DAMAGE** dégâts. Elle s'effondre pour la deuxième fois de la journée avec un sourire radieux.",
        "Megumin invoque une Explosion encore plus grande sur le **CREATURE** pour **DAMAGE** dégâts. 'La magie suprême ne peut être utilisée qu'une seule fois… par heure.' Elle ment.",
        "Megumin déclenche son attaque spéciale : une Explosion. Comme toujours. **DAMAGE** dégâts. Le **CREATURE** n'existait plus vraiment après ça.",
      ],
      [
        // Aqua
        "Aqua invoque God Blow sur le **CREATURE** et inflige **DAMAGE** dégâts. Elle regarde Kazuma d'un air qui dit 'j'attends tes excuses'.",
        "Aqua libère ses pouvoirs divins secrets et inflige **DAMAGE** dégâts au **CREATURE**. 'J'aurais pu faire ça depuis le début. Je voulais juste vous voir galérer.'",
        "Aqua déclenche Sacred Break Spell sur le **CREATURE** pour **DAMAGE** dégâts. Surprise générale dans l'équipe. Aqua est offensée qu'ils soient surpris.",
      ],
    ],
  },
  en: {
    youAttackMsgs: [
      [
        // Kazuma
        "Kazuma steals the **CREATURE**'s gear mid-fight and deals **DAMAGE** damage on the way out. 'Not cowardice. Strategy.'",
        'Kazuma waits until the **CREATURE** is distracted, then shoots it in the back for **DAMAGE** damage. He looks very pleased with himself.',
        "Kazuma uses Drain Touch on the **CREATURE** and steals **DAMAGE** HP. 'Thanks for the health points.'",
      ],
      [
        // Darkness
        "Darkness charges the **CREATURE** heroically yelling 'STRIKE ME DOWN!', misses every swing, but still deals **DAMAGE** damage by sheer accident.",
        "Darkness attacks the **CREATURE** with noble fury… and misses. Her second attempt deals **DAMAGE** damage. She looks disappointed she didn't take a hit.",
        "Darkness strikes the **CREATURE** for **DAMAGE** damage. 'Is that all? It didn't even hit me back… how disappointing.'",
      ],
      [
        // Megumin
        'Megumin chants her incantation for three full minutes, points her staff at the sky, and detonates an Explosion on the **CREATURE** for **DAMAGE** damage. She immediately collapses.',
        'Megumin refuses to use anything but Explosion. The **CREATURE** takes **DAMAGE** damage. Megumin must be carried for the rest of the day.',
        "'There is only one true magic!' Megumin fires an Explosion at the **CREATURE** for **DAMAGE** damage and drops to her knees, exhausted. She's smiling anyway.",
      ],
      [
        // Aqua
        "Aqua casts God Requiem on the **CREATURE** for **DAMAGE** damage. 'See? I'm useful!' Nobody responds.",
        'Aqua fires Aqua Beam at the **CREATURE** for **DAMAGE** damage, then immediately demands praise.',
        "Aqua calls down divine judgment on the **CREATURE** for **DAMAGE** damage. 'Kazuma, you saw that, right? Write it down!'",
      ],
    ],
    youDefendMsgs: [
      [
        // Kazuma
        "Kazuma hides behind Darkness and whispers, 'That's literally why we recruited her.'",
        'Kazuma uses Lurk and vanishes into the shadows, leaving his allies to deal with it.',
        'Kazuma hides behind a large shield and shouts encouragements from behind cover.',
      ],
      [
        // Darkness
        "Darkness plants herself in front of the enemy, spreads her arms, and pleads: 'Hit me! I can take everything!'",
        'Darkness takes an impenetrable defensive stance… and still misses every parry attempt. She looks thrilled.',
        "Darkness shields the party with her body. 'No blow frightens me!' She seems genuinely eager to take one.",
      ],
      [
        // Megumin
        'Megumin is already on the ground after her explosion. She defends herself by being physically unable to move.',
        "Megumin raises her staff with a trembling hand. 'I can still fight!' She clearly cannot.",
        "Megumin attempts a defensive stance, but someone has to hold her upright. She doesn't mind — her dignity remains intact.",
      ],
      [
        // Aqua
        'Aqua summons a Sacred Barrier… which dissolves in seconds. She insists it worked last time.',
        'Aqua closes her eyes and prays very hard. Somehow, this seems to work about half the time.',
        "Aqua hides behind Kazuma and declares that goddesses don't do the dirty work.",
      ],
    ],
    youHugMsgs: [
      ['Kazuma hugs the **CREATURE** with a suspicious smile. He definitely pickpocketed it.', "Kazuma holds the **CREATURE** close. 'You know, you're not so bad.' He checks its pockets afterward.", "Kazuma hugs the **CREATURE**. Darkness is jealous. Aqua is disgusted. Megumin doesn't look up from her grimoire."],
      ["Darkness embraces the **CREATURE** with chivalric intensity. 'I protect even my enemies!' The **CREATURE** looks confused.", "Darkness hugs the **CREATURE** very tightly. 'Feel free to resist.' It doesn't resist. She's disappointed.", 'Darkness hugs the **CREATURE** and whispers a prayer over it. Kazuma sighs from the background.'],
      ["Megumin sets down her staff and hugs the **CREATURE** with unexpected solemnity. 'Even enemies deserve the Explosion of love.'", "Megumin hugs the **CREATURE** with her eyes closed, very seriously. She calls it 'the reconciliation ritual'. Nobody argues.", "Megumin holds the **CREATURE** close. 'Be honored — I only do this once a day. And I've already used my Explosion.'"],
      ["Aqua hugs the **CREATURE** while crying. 'Even monsters have souls!' She is crying a lot.", 'Aqua generously embraces the **CREATURE** and accidentally purifies it in the process. It did not ask to be purified.', "Aqua hugs the **CREATURE**, then insists Kazuma ordered her to do it so she doesn't lose face."],
    ],
    aquaHealMsgs: ['Aqua heals the party for 15 HP, then demands formal thanks and acknowledgment of her divine title.', "Aqua calls upon her divine powers and restores 15 HP. 'See? Indispensable. Write that down.' Nobody writes it down.", "Aqua cries a little, prays a lot, and eventually heals the party for 15 HP. 'I want sake tonight.'"],
    youSpecialAttackMsgs: [
      [
        // Kazuma
        "Kazuma activates Aimed Shot, methodically finds the **CREATURE**'s weak point, and deals **DAMAGE** damage. 'See? I have useful skills, you ungrateful lot.'",
        'Kazuma triggers his special skill on the **CREATURE** for **DAMAGE** damage. He waited ten minutes for the right moment. Worth it.',
        "Kazuma hits the **CREATURE** with Steal Super Charge for **DAMAGE** damage and swipes its weapon in the same motion. 'Bonus.'",
      ],
      [
        // Darkness
        'Darkness activates Divine Slash and deals **DAMAGE** damage to the **CREATURE**. She frowns — she was hoping to receive the same in return.',
        "Darkness unleashes her special attack on the **CREATURE** for **DAMAGE** damage. 'Is that all? Where's the danger? Where's the PAIN?'",
        'Darkness lands a secret chivalric technique on the **CREATURE** for **DAMAGE** damage. She seemed to be trying to miss. It worked anyway.',
      ],
      [
        // Megumin
        'Megumin deploys her ultimate magic — a second Explosion. **DAMAGE** damage. She collapses for the second time today with a radiant smile.',
        "Megumin fires an even bigger Explosion at the **CREATURE** for **DAMAGE** damage. 'Ultimate magic can only be used once… per hour.' She's lying.",
        "Megumin uses her special attack: Explosion. As always. **DAMAGE** damage. The **CREATURE** didn't really exist after that.",
      ],
      [
        // Aqua
        "Aqua unleashes God Blow on the **CREATURE** for **DAMAGE** damage. She looks at Kazuma in a way that says 'I expect an apology.'",
        "Aqua releases her hidden divine power and deals **DAMAGE** damage to the **CREATURE**. 'I could have done this the whole time. I wanted to watch you struggle.'",
        "Aqua casts Sacred Break Spell on the **CREATURE** for **DAMAGE** damage. The whole party is shocked. Aqua is offended that they're shocked.",
      ],
    ],
  },
};

export default lines;
