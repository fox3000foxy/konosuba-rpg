const fs = require('fs');
const express = require('express')
const app = express()

//Import utils
const processUrl = require(__dirname+'/utils/processUrl')
const processGame = require(__dirname+'/utils/processGame')

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

module.exports = (name, {
    app
}) => {
    app.use(express.json())
    //app.get('/favicon.ico',(req,res)=>{res.send("uh")})
	app.use('/konosuba-rpg/assets',express.static(__dirname+"/assets"))
	app.get('/konosuba-rpg/:lang/*',async (req,res)=>{
		let [rand,moves,seed_str,monster] = await processUrl(req.originalUrl)
		let buffer = await processGame(rand,moves,seed_str,monster,req.params.lang)
		res.setHeader("Content-Type","image/png")
		res.send(buffer)
	})
    let alreadyDid = false
    app.post('/discordmon/interactions', (req, res) => {
        // console.log("Pinged by Discord:",req.body)
        if (req.body.type == 1) {
			if(!alreadyDid) {
				alreadyDid = true
				res.send({
					type: 1
				})
			}
			else {
				alreadyDid = false
				res.status(401).send({})				
			}
        } else {
            interaction = req.body
			// console.log(interaction)
			const lang = (interaction?.guild?.features?.includes("COMMUNITY")) ? (interaction?.guild_locale) : (interaction ?.locale)
			const userID = (interaction?.member?.user?.id || interaction.user.id)
            if (interaction.data?.name == "start") {
                let id = makeid(15)
                res.send({
                    type: 4,
                    data: {
					    "embeds": [
							{
							  "image": { "url": "https://stella.jsannier.fr/konosuba-rpg/"+lang+"/" + id },
							  "description": lang=="fr"?"**Partie de <@"+userID+">**":"**<@"+userID+"> game**",
							  color: 0x2b2d31 
							}
						  ],
						// content: "<@" + userID + ">",
                        // content: "https://stella.jsannier.fr/konosuba-rpg/" + ,
						components: [{
							"type": 1,
							"components": [
									{
										"type": 2,
										"label": lang=="fr"?"Attaquer 1 fois":"Attack 1 time",
										"style": 4,
										"custom_id": id + "/a:" + userID
									},
									{
										"type": 2,
										"label": lang=="fr"?"Attaquer 4 fois":"Attack 4 times",
										"style": 4,
										"custom_id": id + "/aaaa:" + userID
									},
									{
										"type": 2,
										"label": lang=="fr"?"Câliner 1 fois":"Hug 1 time",
										"style": 1,
										"custom_id": id + "/h:" + userID
									},
									{
										"type": 2,
										"label": lang=="fr"?"Câliner 4 fois":"Hug 4 times",
										"style": 1,
										"custom_id": id + "/hhhh:" + userID
									},
									{
										"type": 2,
										"label": lang=="fr"?"Se défendre":"Defend",
										"style": 3,
										"custom_id": id + "/d:" + userID
									},
								]
							},{
                                "type": 1,
                                "components": [
									{
										"type": 2,
										"label": lang=="fr"?"Recommencer":"Restart",
										"style": 2,
										"custom_id": id
										.split("/").join("")
										.split("a").join("")
										.split("d").join("")
										.split("g").join("")
										.split("h").join("") +":" + userID,
										// "disabled": true
									},
									{
										"type": 2,
										"label": lang=="fr"?"Abandonner":"Give up",
										"style": 2,
										"custom_id": id + "/g:" + userID,
										// "disabled": true
									},
									{
										"type": 2,
										"label": lang=="fr"?"Changer de monstre":"Change monster",
										"style": 2,
										"custom_id": makeid(15) + ":" + userID,
										// "disabled": true
									},
									/* {
										"type": 2,
										"label": "Reprendre sa partie (Autres joueurs)",
										"style": 2,
										"custom_id": id + ":all",
										// "disabled": true
									}, */
										
								]
							}
						]
                    }
                })
            } else if (interaction.data?.name == "train") {
				let monsterName = interaction.data.options.find(c=>c.name=="monster").value
				if(fs.existsSync(__dirname+'/classes/mobs/'+monsterName+'.js')){
					let id = makeid(10)
					res.send({
						type: 4,
						data: {
							"embeds": [
								{
								  "image": { "url": "https://stella.jsannier.fr/konosuba-rpg/"+lang+"/" + id + "?training=true&monster="+monsterName},
								  "description": lang=="fr"?"**Partie de <@"+userID+">**":"**<@"+userID+"> game**",
								  color: 0x2b2d31 
								}
							  ],
							// content: "<@" + userID + ">",
							// content: "https://stella.jsannier.fr/konosuba-rpg/" + ,
							components: [{
								"type": 1,
								"components": [
										{
											"type": 2,
											"label": lang=="fr"?"Attaquer 1 fois":"Attack 1 time",
											"style": 4,
											"custom_id": "train."+monsterName+"."+id + "/a:" + userID
										},
										{
											"type": 2,
											"label": lang=="fr"?"Attaquer 4 fois":"Attack 4 times",
											"style": 4,
											"custom_id": "train."+monsterName+"."+id + "/aaaa:" + userID
										},
										{
											"type": 2,
											"label": lang=="fr"?"Câliner 1 fois":"Hug 1 time",
											"style": 1,
											"custom_id": "train."+monsterName+"."+id + "/h:" + userID
										},
										{
											"type": 2,
											"label": lang=="fr"?"Câliner 4 fois":"Hug 4 times",
											"style": 1,
											"custom_id": "train."+monsterName+"."+id + "/hhhh:" + userID
										},
										{
											"type": 2,
											"label": lang=="fr"?"Se défendre":"Defend",
											"style": 3,
											"custom_id": "train."+monsterName+"."+id + "/d:" + userID
										},
									]
								},{
									"type": 1,
									"components": [
										{
											"type": 2,
											"label": lang=="fr"?"Recommencer":"Restart",
											"style": 2,
											"custom_id": "train."+monsterName+"."+id
											.split("/").join("")
											.split("a").join("")
											.split("d").join("")
											.split("g").join("")
											.split("h").join("") +":" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Abandonner":"Give up",
											"style": 2,
											"custom_id": "train."+monsterName+"."+id + "/g:" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Changer de monstre":"Change monster",
											"style": 2,
											"custom_id": "train."+monsterName+"."+makeid(10) + ":" + userID,
											"disabled": true
										},
/* 										{
											"type": 2,
											"label": "Reprendre sa partie (Autres joueurs)",
											"style": 2,
											"custom_id": "train."+monsterName+"."+id + ":all",
											// "disabled": true
										}, */
											
									]
								}
							]
						}
					})
				}else{
					const allMobs = fs.readdirSync(__dirname+"/classes/mobs/").filter(m=>m.endsWith(".js"))
					res.send({
						type: 4,
						data: {
							embeds: [{
								description: (lang=="fr"?"Ce monstre est invalide. Voici les monstres valides: ":"Invalid monster. There are valid monsters: ")+allMobs.map(u=>u.split(".js")[0]).join(", ")
							}]
						}
					})
				}
				
            } else if (interaction.data?.name == "infos-monster") {
				// console.log(interaction.data)
				let monsterName = interaction.data.options.find(c=>c.name=="monster").value
				if(fs.existsSync(__dirname+'/classes/mobs/'+monsterName+'.js')){
					const rand = new (require(__dirname+'/utils/Random.js'))()
						rand.choice = (array) => {
						return array[Math.floor(rand() * array.length)]
					}

					rand.randint = (min,max) => {
						return Math.floor(rand() * (max - min)) + min
					}

					rand.integer = (integer1,integer2) => {
						const array = [integer1,integer2]
						return array[Math.floor(rand() * array.length)]
					}
					// console.log(rand)
					const monster = new (require(__dirname+'/classes/mobs/'+monsterName))(rand)
					res.send({
						type: 4,
						data: {
							// content: "Voici les infos de "+ monster.name,
							embeds: [{
								description: 
lang=="fr"?`
# Informations de monstre:

**Nom**: ${monster.name}
**PV**: ${monster.hp} PV
**ATK**: ${monster.attack[0]}-${monster.attack[1]} points de dégats.
**LP**: ${monster.love!=100?monster.love+" points d'amours":"Ne peut pas être ami"}
**Image**: 
`:`
# Monster infos:

**Name**: ${monster.name}
**HP**: ${monster.hp} HP
**ATK**: ${monster.attack[0]}-${monster.attack[1]} damage points.
**LP**: ${monster.love!=100?monster.love+" love points":"Can't be friends"}
**Picture**: 
`,
								image: {"url": "https://stella.jsannier.fr/konosuba-rpg/assets/mobs/"+monster.images[0]+".png"},
								  color: 0x2b2d31
							}]
						}
					})
				}else{
					const allMobs = fs.readdirSync(__dirname+"/classes/mobs/").filter(m=>m.endsWith(".js"))
					res.send({
						type: 4,
						data: {
							embeds: [{
								description: (lang=="fr"?"Ce monstre est invalide. Voici les monstres valides: ":"Invalid monster. There are valid monsters: ")+allMobs.map(u=>u.split(".js")[0]).join(", ")
							}]
						}
					})
				}
			} else if (interaction.data?.name == "infos-player") {
				// console.log(interaction.data)
				let characterId = interaction.data.options.find(c=>c.name=="character").value
				const rand = new (require(__dirname+'/utils/Random.js'))()
					rand.choice = (array) => {
					return array[Math.floor(rand() * array.length)]
				}

				rand.randint = (min,max) => {
					return Math.floor(rand() * (max - min)) + min
				}

				rand.integer = (integer1,integer2) => {
					const array = [integer1,integer2]
					return array[Math.floor(rand() * array.length)]
				}
				// console.log(rand)
				const characters = new (require(__dirname+'/classes/Player.js'))(rand)
				// console.log(characters)
				res.send({
					type: 4,
					data: {
						// content: "Voici les infos de "+ monster.name,
						embeds: [{
							description: 
lang=="fr"?`
# Informations sur ${characters.name[characterId]}:

**Nom**: ${characters.name[characterId]}
**PV**: ${characters.hp[characterId]} PV
**ATK**: ${characters.attack[characterId][0]}-${characters.attack[characterId][1]} points de dégats.
**Image**: 
`:`
# Information about ${characters.name[characterId]}:

**Name**: ${characters.name[characterId]}
**HP**: ${characters.hp[characterId]} HP
**ATK**: ${characters.attack[characterId][0]}-${characters.attack[characterId][1]} damage points.
**Picture**:
`,
							image: {"url": "https://stella.jsannier.fr/konosuba-rpg/assets/player/chara0"+characterId+"_HD.png?"+makeid(5)},
							  color: 0x2b2d31
						}]
					}
				})
			}
			// console.log(interaction)
            interaction.customId = interaction.data.custom_id
            if (interaction.customId) {
                if (
					userID == interaction.customId.split(":")[1] ||
					"all" == interaction.customId.split(":")[1]
				) {
                    res.send({
                        type: userID == interaction.customId.split(":")[1]?7:4,
                        data: {
							  "embeds": [
								{
								  "image": { "url": "https://stella.jsannier.fr/konosuba-rpg/" +lang+"/"+ interaction.customId.split(":")[0]
									.split("a").join("/atk")
									.split("d").join("/def")
									.split("g").join("/giv")
									.split("h").join("/hug") + (interaction.customId.indexOf("train")!=-1?"/?training=true&monster="+interaction.customId.split(".")[1]:"")
									},
								  "description": lang=="fr"?"**Partie de <@"+userID+">**":"**<@"+userID+"> game**",
								  color: 0x2b2d31
								}
							  ],
                            // content: "<@" + userID + ">",
                            components: [{
                                "type": 1,
                                "components": [
										{
											"type": 2,
											"label": lang=="fr"?"Attaquer 1 fois":"Attack 1 time",
											"style": 4,
											"custom_id": interaction.customId.split(":")[0] + "a:" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Attaquer 4 fois":"Attack 4 times",
											"style": 4,
											"custom_id": interaction.customId.split(":")[0] + "aaaa:" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Câliner 1 fois":"Hug 1 time",
											"style": 1,
											"custom_id": interaction.customId.split(":")[0] + "h:" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Câliner 4 fois":"Hug 4 times",
											"style": 1,
											"custom_id": interaction.customId.split(":")[0] + "hhhh:" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Se défendre":"Defend",
											"style": 3,
											"custom_id": interaction.customId.split(":")[0] + "d:" + userID,
											// "disabled": true
										},
									]
								},{
                                "type": 1,
                                "components": [
										{
											"type": 2,
											"label": lang=="fr"?"Recommencer":"Restart",
											"style": 2,
											"custom_id": interaction.customId.split(":")[0]
											.split("/").join("")
											.split("train").join("trqin")
											.split("a").join("")
											.split("trqin").join("train")
											.split("d").join("")
											.split("g").join("")
											.split("h").join("") +":" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Abandonner":"Give up",
											"style": 2,
											"custom_id": interaction.customId.split(":")[0] + "g:" + userID,
											// "disabled": true
										},
										{
											"type": 2,
											"label": lang=="fr"?"Changer de monstre":"Change monster",
											"style": 2,
											"custom_id": interaction.customId.indexOf("train")!=-1?"train."+interaction.customId.split(".")[1]+"."+makeid(10):makeid(15) + ":" + userID,
											"disabled": interaction.customId.indexOf("train")!=-1?true:false
										},
/* 										{
											"type": 2,
											"label": "Reprendre sa partie (Autres joueurs)",
											"style": 2,
											"custom_id": interaction.customId.split(":")[0] + ":all",
											// "disabled": true
										}, */
										
								]
							}]
                        }
                    })
                } else {
                    res.send({
                        type: 4,
                        data: {
                            content: "Ce n'est pas votre partie !",
                            ephemeral: true,
                            flags: 1 << 6
                        }
                    })
                }
            }
        }
    })
    // app.listen(3020,()=>{
    	// console.log("App started")
		// const localtunnel = require('localtunnel');

		// (async () => {
		  // const tunnel = await localtunnel({ port: 3020, subdomain:"fox3000foxy" });

		  // tunnel.url;
		  // console.log(tunnel.url)

		  // tunnel.on('close', () => {
		  // });
		// })();
    // })
}
// module.exports("",{app})
