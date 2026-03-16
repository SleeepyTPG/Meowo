const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStreak, getUserStreakData } = require('../../updates/streaks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('streak')
        .setDescription('Check your current meow streak')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;

        const streak = getStreak(guild.id, targetUser.id);
        const userData = getUserStreakData(guild.id, targetUser.id);
        const lastMeow = userData.lastMeow;

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`🐱 ${targetUser.displayName}'s Meow Streak`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Current Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, inline: true },
                { name: 'Last Meow', value: lastMeow ? new Date(lastMeow).toLocaleDateString() : 'Never', inline: true }
            )
            .setDescription('Use `/meow` daily to keep your streak alive! 🔥')
            .setFooter({ text: 'Miss a day and your streak resets 😿' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};