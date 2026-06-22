require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initTables } = require('./utils/database');
const { reconcileVoiceSessions } = require('./updates/unemployment');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.commands = new Collection();

// Global listeners for robustness (log, prevent silent crashes)
client.on('error', (e) => console.error('Discord client error:', e));
client.on('warn', (w) => console.warn('Discord client warning:', w));
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});

function loadCommands(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadCommands(filePath);
        } else if (file.name.endsWith('.js')) {
            try {
                const command = require(filePath);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                } else {
                    console.warn(`Command at ${filePath} is missing "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`Error loading command at ${filePath}:`, error);
            }
        }
    }
}

function loadEvents(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadEvents(filePath);
        } else if (file.name.endsWith('.js')) {
            try {
                const event = require(filePath);
                if (event.name && event.execute) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args));
                    }
                } else {
                    console.warn(`Event at ${filePath} is missing "name" or "execute" property.`);
                }
            } catch (error) {
                console.error(`Error loading event at ${filePath}:`, error);
            }
        }
    }
}

loadCommands(path.join(__dirname, 'commands'));
loadEvents(path.join(__dirname, 'events'));

// Build command data once and expose on client so guildCreate (and future code) can use it
const commandData = [];
client.commands.forEach(command => {
    commandData.push(command.data.toJSON());
});
client.commandData = commandData;

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Initialise MySQL tables before anything else touches the DB
    try {
        await initTables();
    } catch (error) {
        console.error('Failed to initialise database tables:', error);
        // Fail fast — bot is useless without its data layer
        process.exit(1);
    }

    // Reconcile voice sessions early so unemployment tracking is accurate even after restarts/downtime
    try {
        await reconcileVoiceSessions(client);
    } catch (error) {
        console.error('Voice reconcile failed (non-fatal):', error);
    }

    let totalUsers = 0;
    for (const guild of client.guilds.cache.values()) {
        try {
            const members = await guild.members.fetch();
            totalUsers += members.filter(member => !member.user.bot).size;
        } catch (error) {
            console.error(`Error fetching members for guild ${guild.name}:`, error);
        }
    }

    client.user.setPresence({
        activities: [{
            name: `🐱 Purring for ${totalUsers} cats! 🐾`,
            type: ActivityType.Listening
        }],
        status: 'online'
    });
    console.log(`Set presence: Listening to "🐱 Purring for ${totalUsers} cats! 🐾"`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const rawGuildId = process.env.GUILD_ID;
    const devGuildId = rawGuildId && rawGuildId.trim() ? rawGuildId.trim() : null;

    // Always register global commands → commands work in every server the bot is in
    try {
        console.log('Started refreshing global application (/) commands.');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: client.commandData },
        );
        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error('Failed to register global commands:', error);
    }

    // Register guild commands for all current guilds so commands appear instantly (no global cache delay)
    let registeredGuilds = 0;
    for (const guild of client.guilds.cache.values()) {
        try {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                { body: client.commandData },
            );
            registeredGuilds++;
        } catch (error) {
            console.error(`Failed to register guild commands for ${guild.id}:`, error.message);
        }
    }
    if (registeredGuilds > 0) {
        console.log(`Registered guild commands instantly for ${registeredGuilds} guild(s).`);
    }

    // Optional: also register (again) to a specific dev guild — harmless and gives you the fastest feedback loop
    if (devGuildId) {
        try {
            console.log(`Dev guild override: refreshing commands for ${devGuildId}.`);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, devGuildId),
                { body: client.commandData },
            );
            console.log(`Dev guild commands refreshed for ${devGuildId}.`);
        } catch (error) {
            console.error(`Failed to register for dev guild ${devGuildId}:`, error);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution error:', error);
        // Avoid "already replied" errors — use appropriate follow-up path
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            }
        } catch (replyErr) {
            console.error('Failed to send error reply:', replyErr);
        }
    }
});

client.login(process.env.TOKEN);
