const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setStreakChannel, getGuildConfig } = require('../updates/streaks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-meow-channel')
        .setDescription('Set the channel for meow streaks (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where meow messages will count for streaks')
                .setRequired(true)),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guild = interaction.guild;

        // Check if it's a text channel
        if (channel.type !== 0) { // 0 is GUILD_TEXT
            return await interaction.reply({ content: 'Please select a text channel!', ephemeral: true });
        }

        setStreakChannel(guild.id, channel.id);

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🐱 Meow Channel Set!')
            .setDescription(`Meow streaks will now be tracked in ${channel}`)
            .setFooter({ text: 'Users can send "meow" in this channel to maintain their streaks' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};