const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getTopUsers } = require('../../updates/levels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top meow levels in the server')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
        const guild = interaction.guild;
        const topUsers = await getTopUsers(guild.id, 10);

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

        const entries = await Promise.all(
            topUsers.map(async (user) => {
                const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                const name = member ? member.displayName : 'Unknown User';
                const prefix = medals[user.rank - 1] ?? `**#${user.rank}**`;
                return { prefix, name, level: user.level, xp: user.xp, rank: user.rank };
            })
        );
        for (const e of entries) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${e.prefix} ${e.name} — Level ${e.level} (${e.xp} XP)`)
            );
            if (e.rank < topUsers.length) {
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
