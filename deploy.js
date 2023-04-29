require('dotenv').config();

const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [
    {
        name: 'wheel',
        description: 'Spin the wheel!',
        options: [
            {
                name: 'options',
                description: 'The options to spin the wheel with',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ],
    },
    {
        name: 'wheel-reactions',
        description: 'Spin the wheel with reactions!',
        options: [
            {
                name: 'message-link',
                description: 'The link to the message to spin the wheel with',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'wheel-voice',
        description: 'Spin the wheel with voice!'
    },
    {
        name: 'wheel-members-online',
        description: 'Spin the wheel using online members'
    },
    {
        name: 'wheel-members-online-role',
        description: 'Spin the wheel using online role members'
    }
];

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.DISCORD_BOT_ID, process.env.DISCORD_GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();