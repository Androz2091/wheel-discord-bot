require('dotenv').config();

const Discord = require('discord.js');
const { createGIF } = require('./wheel');

const client = new Discord.Client({
    intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildVoiceStates]
});

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('interactionCreate', async (interaction) => {

    if (interaction.isCommand()) {
        if (interaction.commandName === 'wheel-reactions') {

            const messageLink = interaction.options.getString('message-link');
            const messageId = messageLink.split('/').pop();
            const channelId = messageLink.split('/')[5];

            console.log(messageId, channelId);

            const msg = await client.channels.cache.get(channelId).messages.fetch(messageId);
            const reactions = msg.reactions.cache;
            const users = [];
            for (const reaction of reactions.values()) {
                await reaction.users.fetch();
                users.push(reaction.users.cache.toJSON());
            }
            console.log(users, users.flat());

            const colorsGradient = [
                '#524135',
                '#8c643c',
                '#a07955',
                '#c49c6c',
                '#bc966c'
            ];
            const options = Array.from(new Set(users.flat().map((u) => u.id))).map((opt, idx) => ({
                label: client.users.cache.get(opt)?.username,
                color: colorsGradient[idx % colorsGradient.length]
            }));

            const winnerOption = options[Math.floor(Math.random() * options.length)];
            const winnerIndex = options.indexOf(winnerOption);
            options[winnerIndex] = {
                ...winnerOption,
                winner: true
            };

            await interaction.reply(`Generating wheel with ${options.length} options...`);
            
            createGIF(options).then(async (gif) => {

                // send
                await interaction.editReply({
                    files: [{
                        attachment: gif,
                        name: 'wheel.gif'
                    }]
                });

                setTimeout(() => {
                    interaction.editReply({
                        content: `The winner is **${winnerOption.label}**!`
                    });
                }, 5000);

            })

        }

        if (interaction.commandName === 'wheel-voice') {
            
            const voiceMembers = interaction.member.voice?.channel?.members;
            if (!voiceMembers) {
                return interaction.reply('You must be in a voice channel to use this command!');
            }

            const colorsGradient = [
                '#524135',
                '#8c643c',
                '#a07955',
                '#c49c6c',
                '#bc966c'
            ];
            const options = voiceMembers.map((opt, idx) => ({
                label: opt.user?.username,
                color: colorsGradient[idx % colorsGradient.length]
            }));

            const winnerOption = options[Math.floor(Math.random() * options.length)];
            const winnerIndex = options.indexOf(winnerOption);
            options[winnerIndex] = {
                ...winnerOption,
                winner: true
            };

            await interaction.reply(`Generating wheel with ${options.length} options...`);
            
            createGIF(options).then(async (gif) => {

                // send
                await interaction.editReply({
                    files: [{
                        attachment: gif,
                        name: 'wheel.gif'
                    }]
                });

                setTimeout(() => {
                    interaction.editReply({
                        content: `The winner is **${winnerOption.label}**!`
                    });
                }, 5000);

            })

        }

        if (interaction.commandName === 'wheel') {

            const colorsGradient = [
                '#524135',
                '#8c643c',
                '#a07955',
                '#c49c6c',
                '#bc966c'
            ];
            const options = interaction.options.getString('options').split(',').map((opt, idx) => ({
                label: opt,
                color: colorsGradient[idx % colorsGradient.length]
            }));

            const winnerOption = options[Math.floor(Math.random() * options.length)];
            const winnerIndex = options.indexOf(winnerOption);
            options[winnerIndex] = {
                ...winnerOption,
                winner: true
            };

            await interaction.reply(`Generating wheel with ${options.length} options...`);
            
            createGIF(options).then(async (gif) => {

                // send
                await interaction.editReply({
                    files: [{
                        attachment: gif,
                        name: 'wheel.gif'
                    }]
                });

                setTimeout(() => {
                    interaction.editReply({
                        content: `The winner is **${winnerOption.label}**!`
                    });
                }, 5000);

            })
        }

    }

});

client.login(process.env.DISCORD_BOT_TOKEN);