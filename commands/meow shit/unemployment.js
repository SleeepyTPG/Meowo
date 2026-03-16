const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`🐱 ${targetUser.displayName}'s Unemployment Stats`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Total Time Wasted', value: formatTime(totalTime), inline: true },
                { name: 'Currently in VC', value: isCurrentlyInVC ? 'Yes 🟢' : 'No 🔴', inline: true },
                { name: 'Status', value: totalTime > 0 ? 'Certified Couch Potato 🛋️' : 'Still Productive! 💼', inline: false }
            )
            .setDescription('Time spent lounging in voice channels, doing absolutely nothing productive!')
            .setFooter({ text: 'Milestones are sent via DM when reached! 📩' })
            .setTimestamp();

        // Add fun messages based on time
        const hours = totalTime / (1000 * 60 * 60);
        if (hours >= 1000) {
            embed.addFields({ name: '🏆', value: 'Voice Channel Legend! You live here!', inline: true });
        } else if (hours >= 500) {
            embed.addFields({ name: '👑', value: 'Master of Laziness!', inline: true });
        } else if (hours >= 100) {
            embed.addFields({ name: '🥇', value: 'Professional Couch Surfer!', inline: true });
        } else if (hours >= 24) {
            embed.addFields({ name: '🎖️', value: 'Dedicated Loafer!', inline: true });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
