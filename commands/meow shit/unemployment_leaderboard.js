const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopUnemployed, formatTime } = require('../../updates/unemployment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unemployment-leaderboard')
        .setDescription('View the top unemployed members by voice channel time'),

    async execute(interaction) {
        const guild = interaction.guild;
        const topUsers = getTopUnemployed(guild.id, 10);

        if (topUsers.length === 0) {
            return await interaction.reply({ content: 'No unemployment data yet! Start wasting time in voice channels! 🛋️', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🐱 Unemployment Leaderboard')
            .setDescription('Top members by total time spent being unproductive in voice channels')
            .setFooter({ text: 'Who will claim the throne of laziness? 👑' })
            .setTimestamp();

        let description = '';
        for (const user of topUsers) {
            try {
                const member = await interaction.guild.members.fetch(user.id);
                const name = member.displayName;
                description += `**#${user.rank}** ${name} - ${formatTime(user.totalTime)}\n`;
            } catch (error) {
                description += `**#${user.rank}** Unknown User - ${formatTime(user.totalTime)}\n`;
            }
        }

        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
    },
};