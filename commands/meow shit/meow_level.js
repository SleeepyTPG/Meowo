const { SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getUserData, getXPForNextLevel } = require('../../updates/levels');

function createProgressBar(current, max, length = 10) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your meow level and XP progress'),

    async execute(interaction) {
        const user = interaction.user;
        const guild = interaction.guild;
        const userData = await getUserData(guild.id, user.id);

        const currentLevel = userData.level;
        const currentXP = userData.xp;
        const xpForNext = getXPForNextLevel(currentLevel);
        const xpNeeded = xpForNext - currentXP;
        const progress = currentXP - (currentLevel * 1000);
        const progressMax = 1000;

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## 🐱 ${user.displayName}'s Meow Level 😽`)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**Level:** ${currentLevel}\n**XP:** ${currentXP}\n**Next Level:** ${xpNeeded} XP needed`
                        )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 }))
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
                new TextDisplayBuilder().setContent('-# Keep meowing to level up! 🐾')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
