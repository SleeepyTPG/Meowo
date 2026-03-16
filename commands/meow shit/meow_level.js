const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        const userData = getUserData(guild.id, user.id);

        const currentLevel = userData.level;
        const currentXP = userData.xp;
        const xpForNext = getXPForNextLevel(currentLevel);
        const xpNeeded = xpForNext - currentXP;
        const progress = currentXP - (currentLevel * 1000);
        const progressMax = 1000;

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`🐱 ${user.displayName}'s Meow Level`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Level', value: `${currentLevel}`, inline: true },
                { name: 'XP', value: `${currentXP}`, inline: true },
                { name: 'Next Level', value: `${xpNeeded} XP needed`, inline: true },
                { name: 'Progress', value: `${createProgressBar(progress, progressMax)} ${progress}/${progressMax}`, inline: false }
            )
            .setFooter({ text: 'Keep meowing to level up! 🐾' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
