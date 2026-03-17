require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

// Function to load events
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Calculate total human users across all guilds
    let totalUsers = 0;
    for (const guild of client.guilds.cache.values()) {
        try {
            const members = await guild.members.fetch();
            totalUsers += members.filter(member => !member.user.bot).size;
        } catch (error) {
            console.error(`Error fetching members for guild ${guild.name}:`, error);
        }
    }

    // Set bot presence to show user count
    client.user.setPresence({
        activities: [{
            name: `🐱 Purring for ${totalUsers} cats! 🐾`,
            type: ActivityType.Listening
        }],
        status: 'online'
    });
    console.log(`Set presence: Listening to "🐱 Purring for ${totalUsers} cats! 🐾"`);

    const commands = [];
    client.commands.forEach(command => {
        commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
