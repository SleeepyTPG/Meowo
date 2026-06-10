const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getTopUnemployed, formatTime } = require('../../updates/unemployment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unemployment-leaderboard')
        .setDescription('View the top unemployed members by voice channel time'),

    async execute(interaction) {
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

        for (const user of topUsers) {
            let name;
            try {
                const member = await interaction.guild.members.fetch(user.id);
                name = member.displayName;
            } catch {
                name = 'Unknown User';
            }
            const prefix = medals[user.rank - 1] ?? `**#${user.rank}**`;
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${prefix} ${name} — ${formatTime(user.totalTime)}`)
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
                new TextDisplayBuilder().setContent('-# Who will claim the throne of laziness? 👑')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
