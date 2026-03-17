const { SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { getTotalTime, formatTime, getUserUnemploymentData } = require('../../updates/unemployment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unemployment')
        .setDescription('Check your total time spent being unproductive in voice channels')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;

        const totalTime = getTotalTime(guild.id, targetUser.id);
        const userData = getUserUnemploymentData(guild.id, targetUser.id);
        const isCurrentlyInVC = userData.joinedAt !== null;

        const hours = totalTime / (1000 * 60 * 60);
        let achievement = '';
        if (hours >= 1000) {
            achievement = '\n🏆 **Voice Channel Legend!** You live here!';
        } else if (hours >= 500) {
            achievement = '\n👑 **Master of Laziness!**';
        } else if (hours >= 100) {
            achievement = '\n🥇 **Professional Couch Surfer!**';
        } else if (hours >= 24) {
            achievement = '\n🎖️ **Dedicated Loafer!**';
        }

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## 🐱 ${targetUser.displayName}'s Unemployment Stats 🛋️`)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `Time spent lounging in voice channels, doing absolutely nothing productive!\n\n**Total Time Wasted:** ${formatTime(totalTime)}\n**Currently in VC:** ${isCurrentlyInVC ? 'Yes 🟢' : 'No 🔴'}\n**Status:** ${totalTime > 0 ? 'Certified Couch Potato 🛋️' : 'Still Productive! 💼'}${achievement}`
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
                new TextDisplayBuilder().setContent('-# Milestones are sent via DM when reached! 📩')
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
