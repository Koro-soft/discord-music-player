const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_VOICE_STATES]
});
const voice = require('@discordjs/voice');

client.on('ready', function () {
    client.application.commands.set([{
        name: 'play',
        description: 'Play audio on voice channels',
        options: [{
            type: 'STRING',
            name: 'resource',
            description: 'What to play (YouTube url/url)',
            required: true
        }, {
            type: 'NUMBER',
            name: 'volume',
            description: 'The volume to play.',
            required: false
        }, {
            type: 'BOOLEAN',
            name: 'loop',
            description: 'Whether to loop the music',
            required: false
        }]
    }, {
        name: 'stopmusic',
        description: 'Stop music currently playing'
    }]).then(function () {
        console.log('client is ready');
    });
});

client.on('interactionCreate', async function (interaction) {
    if (interaction.isCommand()) {
        if (interaction.command.name == 'play') {
            if (interaction.member.permissions.has(Discord.Permissions.FLAGS.SPEAK)) {
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
                        let resource = createresource(url, interaction.options.getNumber('volume'));
                        const loop = interaction.options.getBoolean('loop');
                        if (loop) {
                            interaction.editReply('playing music... Run /stopmusic to stop music');
                            while (loop && conn.state.status != voice.VoiceConnectionStatus.Destroyed) {
                                player.play(resource);
                                await voice.entersState(player, voice.AudioPlayerStatus.Playing, 10 * 1000);
                                await voice.entersState(player, voice.AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);
                                resource = createresource(url, interaction.options.getNumber('volume'));
                            }
                        } else {
                            interaction.editReply('playing music...');
                            player.play(resource);
                            await voice.entersState(player, voice.AudioPlayerStatus.Playing, 10 * 1000);
                            await voice.entersState(player, voice.AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);
                            interaction.editReply('end');
                            conn.destroy();
                        }
                    } else {
                        interaction.editReply('Unable to join audio channel');
                    }
                } else {
                    interaction.editReply('Run while you join the voice channel');
                }
            } else {
                interaction.reply({ content: 'you do not have permission to play music', ephemeral: true });
            }
        } else if (interaction.command.name == 'stopmusic') {
            if (interaction.member.permissions.has(Discord.Permissions.FLAGS.MOVE_MEMBERS)) {
                const conn = voice.getVoiceConnection(interaction.guild.id);
                if (conn != undefined) {
                    conn.destroy();
                    interaction.reply({ content: 'Music stopped', ephemeral: true });
                } else {
                    interaction.reply({ content: 'Music is not currently playing', ephemeral: true });
                }
            } else {
                interaction.reply({ content: 'you do not have the permission to stop music', ephemeral: true });
            }
        }
    }
});

client.login();

function createresource(url, vol) {
    let resource;
    let inlineVol = false;
    if (vol) {
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
        resource.volume.setVolume(vol / 100);
    }
    return resource;
}
