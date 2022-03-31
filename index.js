const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.]
});

client.on('ready', function () {
    console.log('client is ready');
});

client.login();