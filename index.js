require('dotenv').config();

const Discord = require('discord.js');
const { createGIF } = require('./wheel');

const
    COLORS_GRADIENT = [
        '#524135',
        '#8c643c',
        '#a07955',
        '#c49c6c',
        '#bc966c'
    ],
    getColorByIndex = idx => COLORS_GRADIENT[idx % COLORS_GRADIENT.length],
    generateAndSendWheel = async (
        interaction,
        options,
        {
            replyMethod = 'reply',
            template = winner => `The winner is **${winner}**!`
        } = {}
    ) => {
        const winnerOption = options[Math.floor(Math.random() * options.length)];
        winnerOption.winner = true;
        await interaction[replyMethod](`Generating wheel with ${options.length} options...`);
        const gif = await createGIF(options);
        await interaction.editReply({
            files: [{
                attachment: gif,
                name: 'wheel.gif'
            }]
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
        await interaction.editReply({ content: template(winnerOption.label) });
    };

const client = new Discord.Client({
    intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildVoiceStates, Discord.IntentsBitField.Flags.GuildPresences, Discord.IntentsBitField.Flags.GuildMembers]
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

            await interaction.deferReply();

            const msg = await client.channels.cache.get(channelId).messages.fetch(messageId);
            const reactions = msg.reactions.cache;
            const users = [];
            for (const reaction of reactions.values()) {
                await reaction.users.fetch();
                users.push(reaction.users.cache.filter((u) => !u.bot).toJSON());
            }
            console.log(users, users.flat());

            const options = Array.from(new Set(users.flat().map((u) => u.id))).map((opt, idx) => ({
                label: client.users.cache.get(opt)?.username,
                color: getColorByIndex(idx)
            }));

            await generateAndSendWheel(interaction, options, { replyMethod: 'followUp' });

        }

        if (interaction.commandName === 'wheel-voice') {

            const voiceMembers = interaction.member.voice?.channel?.members;
            if (!voiceMembers) {
                return interaction.reply('You must be in a voice channel to use this command!');
            }

            const options = voiceMembers.filter((m) => !m.user.bot).map((opt, idx) => ({
                label: opt.user?.username,
                color: getColorByIndex(idx)
            }));

            await generateAndSendWheel(interaction, options);

        }

        if (interaction.commandName === 'wheel-members-online') {

            await interaction.guild.members.fetch({
                withPresences: true
            });

            const options = interaction.guild.members.cache.filter((m) => m.presence && m.presence?.status !== 'invisible' && !m.user.bot) .map((opt, idx) => ({
                label: opt.user.username,
                color: getColorByIndex(idx)
            }));

            await generateAndSendWheel(interaction, options, { template: winner => `**THE WINNER IS ${winner.toUpperCase()}**!` });

        }

        if (interaction.commandName === 'wheel-members-online-role') {

            await interaction.guild.members.fetch({
                withPresences: true
            });

            const options = interaction.guild.members.cache.filter((m) => m.roles.cache.has('1029342182613725246') && !m.user.bot).map((opt, idx) => ({
                label: opt.user.username,
                color: getColorByIndex(idx)
            }));

            await generateAndSendWheel(interaction, options, { template: winner => `**THE WINNER IS ${winner.toUpperCase()}**!` });

        }

        if (interaction.commandName === 'wheel') {

            const options = interaction.options.getString('options').split(',').map((opt, idx) => ({
                label: opt,
                color: getColorByIndex(idx)
            }));

            await generateAndSendWheel(interaction, options);
        }

    }

});

client.login(process.env.DISCORD_BOT_TOKEN);
