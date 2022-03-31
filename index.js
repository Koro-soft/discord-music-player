const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS]
});
const { token } = require('./auth');

client.on('ready', function () {
    client.application.commands.set([{
        name: "music",
        description: "Play audio on voice channels",
        options: [{
            type: "STRING",
            name: "resource",
            description: "What to play ('file'/YouTube url/url)",
            required: true
        }, {
            type: "NUMBER",
            name: "volume",
            description: "The volume to play. The existing value is 100.",
            required: false
        }, {
            type: "BOOLEAN",
            name: "loop",
            description: "Whether to loop the music"
        }]
    }, {
        name: "stopmusic",
        description: "Stop playing music"
    }]).then(function () {
        console.log('client is ready');
    });
});
client.on('interactionCreate', function (interaction) {
    if (interaction.isCommand()) {
        if (interaction.command.name == 'music') {
            
        }
    }
})

client.login(token);