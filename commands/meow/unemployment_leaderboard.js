const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getTopUnemployed, formatTime } = require('../../updates/unemployment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unemployment-leaderboard')
        .setDescription('View the top unemployed members by voice channel time')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
        const guild = interaction.guild;
        const topUsers = await getTopUnemployed(guild.id, 10);

        if (topUsers.length === 0) {
            return await interaction.reply({ content: 'No unemployment data yet! Start wasting time in voice channels! 🛋️', ephemeral: true });
        }

        const medals = ['🥇', '🥈', '🥉'];

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🐱 Unemployment Leaderboard')
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('Top members by total time spent being unproductive in voice channels 🛋️')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );

        const entries = await Promise.all(
            topUsers.map(async (user) => {
                let name;
                try {
                    const member = await interaction.guild.members.fetch(user.id);
                    name = member.displayName;
                } catch {
                    name = 'Unknown User';
                }
                const prefix = medals[user.rank - 1] ?? `**#${user.rank}**`;
                return { prefix, name, totalTime: user.totalTime, rank: user.rank };
            })
        );
        for (const e of entries) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${e.prefix} ${e.name} — ${formatTime(e.totalTime)}`)
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
                new TextDisplayBuilder().setContent('-# Who will claim the throne of laziness? 👑')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
