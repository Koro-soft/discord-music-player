const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_VOICE_STATES]
});
const voice = require('@discordjs/voice');
const { token } = require('./auth');

client.on('ready', function () {
    client.application.commands.set([{
        name: "music",
        description: "Play audio on voice channels",
        options: [{
            type: "STRING",
            name: "resource",
            description: "What to play (YouTube url/url)",
            required: true
        }, {
            type: "NUMBER",
            name: "volume",
            description: "The volume to play. The existing value is 100.",
            required: false
        }]
    }]).then(function () {
        console.log('client is ready');
    });
});

client.on('interactionCreate', async function (interaction) {
    if (interaction.isCommand()) {
        if (interaction.command.name == 'music') {
            await interaction.reply({ content: 'joining voice channel...', ephemeral: true });
            if (interaction.member.voice.channel) {
                if (interaction.member.voice.channel.joinable && interaction.member.voice.channel.speakable) {
                    const conn = voice.joinVoiceChannel({
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                        channelId: interaction.member.voice.channelId,
                        guildId: interaction.guild.id,
                        selfDeaf: true,
                        selfMute: false
                    });
                    interaction.editReply('Downloading resource...');
                    const player = voice.createAudioPlayer({
                        behaviors: {
                            noSubscriber: voice.NoSubscriberBehavior.Pause,
                        }
                    });
                    conn.subscribe(player);
                    const url = interaction.options.getString('resource');
                    let resource
                    let inlineVol = false;
                    if (interaction.options.getNumber('volume')) {
                        inlineVol = true;
                    }
                    if (ytdl.validateURL(url)) {
                        const stream = ytdl(url, {
                            filter: format => format.audioCodec === 'opus' && format.container === 'webm',
                            quality: 'highest',
                            highWaterMark: 32 * 1024 * 1024,
                            format: 'audioonly',
                        });
                        resource = voice.createAudioResource(stream, {
                            inputType: voice.StreamType.WebmOpus,
                            inlineVolume: inlineVol
                        });
                    } else {
                        resource = voice.createAudioResource(url, {
                            inputType: voice.StreamType.Arbitrary,
                            inlineVolume: inlineVol
                        });
                    }
                    if (inlineVol) {
                        resource.volume.setVolume(interaction.options.getNumber('volume'));
                    }
                    player.play(resource);
                    interaction.editReply('playing music...');
                    await voice.entersState(player, voice.AudioPlayerStatus.Playing, 10 * 1000);
                    await voice.entersState(player, voice.AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);
                    interaction.editReply('end');
                    conn.destroy();
                } else {
                    interaction.editReply('Unable to join audio channel');
                }
            } else {
                interaction.editReply('Run while you join the voice channel');
            }
        }
    }
})

client.login(token);