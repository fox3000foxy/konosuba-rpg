const fs = require('fs');
const express = require('express')
const app = express()

//Import utils
const processUrl = require(__dirname+'/utils/processUrl')
const processGame = require(__dirname+'/utils/processGame')

// module.exports = (name,{app})=>{
	// app.get('/favicon.ico',(req,res)=>{res.send("uh")})
	// app.get('/konosuba-rpg/*',async (req,res)=>{
		// let [rand, moves] = await processUrl(req.originalUrl)
		// let buffer = await processGame(rand,moves)
		// res.setHeader("Content-Type","image/png")
		// res.send(buffer)
	// })

	// app.listen(3000,()=>{
		// console.log("App started")
	// })
// }



//const express = require('express')
//const app = express()

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefgijklmnopqrstuvwxyz0123456789';
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
	app.get('/konosuba-rpg/*',async (req,res)=>{
		let [rand, moves] = await processUrl(req.originalUrl)
		let buffer = await processGame(rand,moves)
		res.setHeader("Content-Type","image/png")
		res.send(buffer)
	})
    let alreadyDid = false
    app.post('/discordmon/interactions', (req, res) => {
        //console.log("Pinged by Discord:",req.body)
        if (req.body.type == 1) {
			if(!alreadyDid)
				res.send({
					type: 1
				})
            alreadyDid = true
        } else {
            interaction = req.body
            if (interaction.data?.name == "start") {
                let id = makeid(15)
                res.send({
                    type: 4,
                    data: {
                        content: "https://stella.jsannier.fr/konosuba-rpg/" + id,
                        "components": [{
                            "type": 1,
                            "components": [
								{
                                    "type": 2,
                                    "label": "Attaquer 1 fois",
                                    "style": 4,
                                    "custom_id": id + "/a:" + interaction.member.user.id
                                },
								{
                                    "type": 2,
                                    "label": "Attaquer 4 fois",
                                    "style": 4,
                                    "custom_id": id + "/aaaa:" + interaction.member.user.id
                                },
                                {
                                    "type": 2,
                                    "label": "Se défendre",
                                    "style": 3,
                                    "custom_id": id + "/d:" + interaction.member.user.id
                                },
                                {
                                    "type": 2,
                                    "label": "Câliner",
                                    "style": 1,
                                    "custom_id": id + "/h:" + interaction.member.user.id
                                }
                            ]
                        }]
                    }
                })
            }
            interaction.customId = interaction.data.custom_id
            if (interaction.customId) {
                if (interaction.member.user.id == interaction.customId.split(":")[1]) {
                    res.send({
                        type: 7,
                        data: {
                            content: "https://stella.jsannier.fr/konosuba-rpg/" + interaction.customId.split(":")[0]
                                .split("a").join("/atk")
                                .split("d").join("/def")
                                .split("h").join("/hug"),
                            components: [{
                                "type": 1,
                                "components": [
										{
											"type": 2,
											"label": "Attaquer 1 fois",
											"style": 4,
											"custom_id": interaction.customId.split(":")[0] + "a:" + interaction.member.user.id,
											// "disabled": true
										},
										{
											"type": 2,
											"label": "Attaquer 4 fois",
											"style": 4,
											"custom_id": interaction.customId.split(":")[0] + "aaaa:" + interaction.member.user.id,
											// "disabled": true
										},
										{
											"type": 2,
											"label": "Se défendre",
											"style": 3,
											"custom_id": interaction.customId.split(":")[0] + "d:" + interaction.member.user.id,
											// "disabled": true
										},
										{
											"type": 2,
											"label": "Câliner",
											"style": 1,
											"custom_id": interaction.customId.split(":")[0] + "h:" + interaction.member.user.id,
											// "disabled": true
										}
									]
								},{
                                "type": 1,
                                "components": [
										{
											"type": 2,
											"label": "Recommencer",
											"style": 1,
											"custom_id": interaction.customId.split(":")[0]
											.split("/").join("")
											.split("a").join("")
											.split("d").join("")
											.split("h").join("") +":" + interaction.member.user.id,
											// "disabled": true
										}
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
    // })
}
// module.exports("",{app})