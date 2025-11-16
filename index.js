import Joi from 'joi';
import Discord from 'discord.js';
import ms from 'ms';
import { parseDate } from 'chrono-node';
import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration';

import { createGIF } from './wheel.js';
import { initFastify } from './fastify.js';

dayjs.extend(dayjsDuration);

const
    validateData = data => {
        const durationSchema = Joi.object({
            years: Joi.number().integer().min(0),
            months: Joi.number().integer().min(0),
            days: Joi.number().integer().min(0),
            hours: Joi.number().integer().min(0),
            minutes: Joi.number().integer().min(0),
            seconds: Joi.number().integer().min(0)
        });
        return Joi
            .object({
                schedule: Joi
                    .array()
                    .items(
                        Joi.object({
                            id: Joi
                                .string()
                                .uuid({
                                    version: 'uuidv7'
                                })
                                .required(),
                            startTimestamp: Joi.number().required(),
                            isEnabled: Joi.boolean().required(),
                            lastRunStartTimestamp: Joi.number().allow(null).default(null),
                            runDuration: durationSchema,
                            lastRunEndTimestamp: Joi.number().allow(null).default(null),
                            duration: durationSchema.allow(null).default(null),
                            interval: durationSchema.allow(null).default(null),
                            messageContent: Joi.string().required(),
                            lastRunMessageId: Joi.string().allow(null).default(null)
                        })
                    )
                    .required()
            })
            .validateAsync(data);
    },
    data = await (async () => {
        try {
            const file = Bun.file('./data.json');
            const result = await file.json();
            await Bun.write('./data.bak.json', file);
            return validateData(result);
        }
        catch {
            return {
                schedule: []
            };
        }
    })(),
    setData = async dataChunk => {
        const tmpData = await validateData({ ...data, ...dataChunk });
        Object.assign(data, tmpData);
        await Bun.write('./data.json', JSON.stringify(data, null, 4));
    },
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
    },
    durationAsObject = duration => ({
        years: duration.years(),
        months: duration.months(),
        days: duration.days(),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds()
    });

const client = new Discord.Client({
    intents: Object
        .values(Discord.IntentsBitField.Flags)
        .filter(_ => typeof _ === 'number'),
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

        if(interaction.commandName === 'wheel-reactions-schedule'){
            await interaction.deferReply();
            const
                [
                    content,
                    runDurationString,
                    startDateString,
                    intervalString,
                    durationString
                ] = [
                    'content',
                    'run-duration',
                    'start-date',
                    'interval',
                    'duration'
                ].map(key => interaction.options.getString(key)),
                runDuration = (() => {
                    try {
                        return ms(runDurationString);
                    }
                    catch {}
                })(),
                startTimestamp = dayjs(parseDate(startDateString)).valueOf(),
                interval = intervalString && ms(intervalString),
                duration = durationString && ms(durationString);
            if(!content)
                return interaction.editReply(':x: Invalid content');
            if(!runDuration)
                return interaction.editReply(':x: Invalid run duration');
            if(startDateString !== null && !startTimestamp)
                return interaction.editReply(':x: Invalid start date');
            if(intervalString !== null && !interval)
                return interaction.editReply(':x: Invalid interval');
            if(durationString !== null && !duration)
                return interaction.editReply(':x: Invalid duration');
            const { schedule } = JSON.parse(JSON.stringify(data));
            schedule.push({
                id: Bun.randomUUIDv7(),
                startTimestamp: startTimestamp || Date.now(),
                isEnabled: true,
                runDuration: durationAsObject(dayjs.duration(runDuration)),
                duration: duration && durationAsObject(dayjs.duration(duration)),
                interval: interval && durationAsObject(dayjs.duration(interval)),
                messageContent: content
            });
            await setData({ schedule });
            await interaction.editReply('Wheel spin scheduled successfully!');
        }
    }

});

await Promise.all([
    client.login(process.env.DISCORD_BOT_TOKEN),
    new Promise(resolve => client.once('ready', resolve))
]);

console.log('I am ready!');

(async function scheduleLoop(){
    if(!Array.isArray(data.schedule) || !data.schedule.length) return setTimeout(scheduleLoop, 1000);
    const now = dayjs();
    let isDataUpdated = false;
    for(const item of data.schedule){
        const startDate = dayjs(item.startTimestamp);
        if(
            !item.isEnabled // is disabled
            ||
            now.isBefore(startDate) // start time is not reached
        ) continue;
        const
            hasBeenRun = !isNaN(parseInt(item.lastRunStartTimestamp)),
            lastRunStartDate = dayjs(item.lastRunStartTimestamp),
            hasBeenEnded = !isNaN(parseInt(item.lastRunEndTimestamp)),
            lastRunEndDate = dayjs(item.lastRunEndTimestamp),
            runDuration = dayjs.duration(item.runDuration);
        if(hasBeenRun){
            const endDate = lastRunStartDate.add(runDuration);
            if(
                now.isAfter(endDate) // is expired
                &&
                (
                    !hasBeenEnded // has not been ended
                    ||
                    lastRunEndDate.isBefore(endDate) // has been ended only during a previous run
                )
            ){
                isDataUpdated = true;
                item.lastRunEndTimestamp = now.valueOf();
                let message;
                try {
                    message = await Promise
                        .resolve(process.env.DISCORD_CHANNEL_ID)
                        .then(_ => client.channels.cache.get(_))
                        .then(channel => channel.messages.fetch(item.lastRunMessageId));
                }
                catch {}
                if(!message) continue;
                const options = await Promise
                    .resolve(message)
                    .then(message => [...message.reactions.cache.values()])
                    .then(reactions => reactions.flatMap(reaction => reaction.users.cache.filter(user => !user.bot).toJSON()))
                    .then(users => [...new Set(users.map(user => user.id))])
                    .then(userIds => userIds.map(userId => message.guild.members.cache.get(userId).displayName))
                    .then(usernames => usernames.map(
                        (
                            username,
                            index
                        ) => ({
                            label: username,
                            color: getColorByIndex(index)
                        })
                    ));
                if(!options.length) continue;
                const winnerOption = options[Math.floor(Math.random() * options.length)];
                winnerOption.winner = true;
                const [
                    winnerMessage,
                    gif
                ] = await Promise.all([
                    message.reply(`Generating wheel with ${options.length} options...`),
                    createGIF(options)
                ]);
                await winnerMessage.edit({
                    content: `The winner is **${winnerOption.label}**!`,
                    files: [{
                        attachment: gif,
                        name: 'wheel.gif'
                    }]
                });
                continue;
            }
        }
        const
            duration = item.duration && dayjs.duration(item.duration),
            hasDuration = !!duration?.valueOf(),
            interval = item.interval && dayjs.duration(item.interval),
            hasInterval = !!interval?.valueOf();
        if(
            !hasDuration && !hasInterval && hasBeenRun // has no duration/interval and has been run
            ||
            hasDuration && now.isAfter(startDate.add(duration)) // duration elapsed
            ||
            hasInterval && hasBeenRun && now.isBefore(lastRunStartDate.add(runDuration).add(interval)) // interval not elapsed
        ) continue;
        isDataUpdated = true;
        item.lastRunStartTimestamp = now.valueOf();
        item.lastRunMessageId = (await client.channels.cache.get(process.env.DISCORD_CHANNEL_ID).send(item.messageContent)).id;
    }
    if(isDataUpdated)
        await setData();
    setTimeout(scheduleLoop, 1000);
})();

if(process.env.FASTIFY_PORT && process.env.FASTIFY_API_KEY){
    await initFastify({
        apiKey: process.env.FASTIFY_API_KEY,
        port: process.env.FASTIFY_PORT,
        getData: () => JSON.parse(JSON.stringify(data)),
        setData
    });
    console.log(`Fastify server listening to http://localhost:${process.env.FASTIFY_PORT}`);
}