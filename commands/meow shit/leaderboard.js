const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
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

        const medals = ['🥇', '🥈', '🥉'];

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🐱 Meow Leaderboard')
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('Top members by meow level and XP 💕')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

        for (const user of topUsers) {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const name = member ? member.displayName : 'Unknown User';
            const prefix = medals[user.rank - 1] ?? `**#${user.rank}**`;
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${prefix} ${name} — Level ${user.level} (${user.xp} XP)`)
            );
            if (user.rank < topUsers.length) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                );
            }
        }

        container
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('-# Keep meowing to climb the ranks! 🐾')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};