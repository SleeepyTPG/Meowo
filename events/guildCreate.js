const { REST, Routes } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        if (!guild?.id || !guild.client?.commandData?.length) return;

        console.log(`📥 Joined new guild: ${guild.name} (${guild.id}) — registering commands for instant availability...`);

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        try {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                { body: guild.client.commandData },
            );
            console.log(`✅ Commands registered instantly for new guild ${guild.id}.`);
        } catch (error) {
            console.error(`Failed to register commands for new guild ${guild.id}:`, error);
        }
    },
};
