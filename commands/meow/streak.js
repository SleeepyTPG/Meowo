const { SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getStreak, getUserStreakData } = require('../../updates/streaks');
const { formatBerlinDateForDisplay } = require('../../utils/dates');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('streak')
        .setDescription('Check your current meow streak')
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;

        const streak = await getStreak(guild.id, targetUser.id);
        const userData = await getUserStreakData(guild.id, targetUser.id);
        const lastMeow = userData.lastMeow;

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## 🐱 ${targetUser.displayName}'s Meow Streak 🔥`)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**Current Streak:** ${streak} day${streak !== 1 ? 's' : ''}\n**Last Meow:** ${lastMeow ? formatBerlinDateForDisplay(lastMeow) : 'Never'}`
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ size: 256 }))
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('-# Miss a day and your streak resets 😿')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
