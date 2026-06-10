const { SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getUserData, getXPForNextLevel, getRank } = require('../../updates/levels');
const { createProgressBar } = require('../../utils/components');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a user\'s meow profile')
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;
        const userData = await getUserData(guild.id, targetUser.id);

        const currentLevel = userData.level;
        const currentXP = userData.xp;
        const xpForNext = getXPForNextLevel(currentLevel);
        const xpNeeded = xpForNext - currentXP;
        const progress = currentXP - (currentLevel * 1000);
        const progressMax = 1000;
        const rank = await getRank(guild.id, targetUser.id);

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## 🐱 ${targetUser.displayName}'s Meow Profile 💕`)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**Level:** ${currentLevel}\n**XP:** ${currentXP}\n**Rank:** ${rank ? `#${rank}` : 'Unranked'}\n**Next Level:** ${xpNeeded} XP needed`
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
                new TextDisplayBuilder().setContent(
                    `${createProgressBar(progress, progressMax)} ${progress}/${progressMax}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('-# Meow levels are earned by being active in the server! 🐾')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
