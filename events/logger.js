const { giveXPWithCooldown } = require('../updates/levels');
const { updateStreak, getGuildConfig } = require('../updates/streaks');
const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require('discord.js');

module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;

        if (!message.guild) return;

        const xpAmount = Math.floor(Math.random() * 11) + 5; // 5-15
        giveXPWithCooldown(message.guild.id, message.author.id, xpAmount, 60000);

        const config = getGuildConfig(message.guild.id);
        if (config.streakChannel && message.channel.id === config.streakChannel && message.content.toLowerCase().includes('meow')) {
            const user = message.author;
            const guild = message.guild;

            const result = updateStreak(guild.id, user.id);
            const currentStreak = result.streak;
            const streakMessage = result.message;

            let milestoneText = '';
            if (currentStreak === 1) {
                milestoneText = '🎉 First meow of your streak!';
            } else if (currentStreak === 7) {
                milestoneText = '🏆 One week streak! You\'re on fire!';
            } else if (currentStreak === 30) {
                milestoneText = '👑 One month! You\'re a meow master!';
            } else if (currentStreak % 10 === 0) {
                milestoneText = `⭐ ${currentStreak} days! Amazing dedication!`;
            }

            const container = new ContainerBuilder()
                .setAccentColor(0xFFB6C1)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## 🐱 Daily Meow from ${user.displayName}`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `${streakMessage}\n\n**Current Streak:** ${currentStreak} day${currentStreak !== 1 ? 's' : ''} 🔥`
                            )
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(user.displayAvatarURL({ dynamic: true, size: 256 }))
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('Keep it up! Meow again tomorrow to extend your streak!')
                );

            if (milestoneText) {
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(milestoneText)
                );
            }

            container
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# Meow streaks reset if you miss a day 😿\n-# ${new Date().toLocaleString()}`)
                );

            message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
    },
};
