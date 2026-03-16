const { giveXPWithCooldown } = require('../updates/levels');
const { updateStreak, getGuildConfig } = require('../updates/streaks');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Ignore messages not in a guild
        if (!message.guild) return;

        // Give XP for messages (5-15 XP, 1 minute cooldown)
        const xpAmount = Math.floor(Math.random() * 11) + 5; // 5-15
        giveXPWithCooldown(message.guild.id, message.author.id, xpAmount, 60000);

        // Check for meow streak in designated channel
        const config = getGuildConfig(message.guild.id);
        if (config.streakChannel && message.channel.id === config.streakChannel && message.content.toLowerCase().includes('meow')) {
            const user = message.author;
            const guild = message.guild;

            const result = updateStreak(guild.id, user.id);
            const currentStreak = result.streak;
            const streakMessage = result.message;

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`🐱 Daily Meow from ${user.displayName}`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(`${streakMessage}\n\n**Current Streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}** 🔥`)
                .addFields(
                    { name: 'Keep it up!', value: 'Meow again tomorrow to extend your streak!', inline: false }
                )
                .setFooter({ text: 'Meow streaks reset if you miss a day 😿' })
                .setTimestamp();

            // Add special messages for milestones
            if (currentStreak === 1) {
                embed.addFields({ name: '🎉', value: 'First meow of your streak!', inline: true });
            } else if (currentStreak === 7) {
                embed.addFields({ name: '🏆', value: 'One week streak! You\'re on fire!', inline: true });
            } else if (currentStreak === 30) {
                embed.addFields({ name: '👑', value: 'One month! You\'re a meow master!', inline: true });
            } else if (currentStreak % 10 === 0) {
                embed.addFields({ name: '⭐', value: `${currentStreak} days! Amazing dedication!`, inline: true });
            }

            message.reply({ embeds: [embed] });
        }
    },
};
