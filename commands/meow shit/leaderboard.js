const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopUsers } = require('../../updates/levels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top meow levels in the server'),

    async execute(interaction) {
        const guild = interaction.guild;
        const topUsers = getTopUsers(guild.id, 10);

        if (topUsers.length === 0) {
            return await interaction.reply({ content: 'No meow levels yet! Start chatting to earn XP.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🐱 Meow Leaderboard')
            .setDescription('Top members by meow level and XP')
            .setFooter({ text: 'Keep meowing to climb the ranks! 🐾' })
            .setTimestamp();

        let description = '';
        for (const user of topUsers) {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const name = member ? member.displayName : 'Unknown User';
            description += `**#${user.rank}** ${name} - Level ${user.level} (${user.xp} XP)\n`;
        }

        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
    },
};