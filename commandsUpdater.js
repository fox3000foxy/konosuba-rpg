const Discord = require('discord.js')
const fs = require('fs')
const client = new Discord.Client({intents: []})

if(!process.env.DISCORD_TOKEN){
	throw new Error('DISCORD_TOKEN manquant dans les variables d\'environnement')
}

client.on('ready',async ()=>{
	// console.log("client ready")
	let commands = JSON.parse(fs.readFileSync(__dirname+"/commands.json").toString())
	await client.application.commands.set(commands)
	console.log("Commandes appliquées")
	client.destroy()
})

client.login(process.env.DISCORD_TOKEN)
