const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, getXPForNextLevel, getRank } = require('../../updates/levels');

function createProgressBar(current, max, length = 10) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a user\'s meow profile')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;
        const userData = getUserData(guild.id, targetUser.id);

        const currentLevel = userData.level;
        const currentXP = userData.xp;
        const xpForNext = getXPForNextLevel(currentLevel);
        const xpNeeded = xpForNext - currentXP;
        const progress = currentXP - (currentLevel * 1000);
        const progressMax = 1000;
        const rank = getRank(guild.id, targetUser.id);

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`🐱 ${targetUser.displayName}'s Meow Profile`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Level', value: `${currentLevel}`, inline: true },
                { name: 'XP', value: `${currentXP}`, inline: true },
                { name: 'Rank', value: rank ? `#${rank}` : 'Unranked', inline: true },
                { name: 'Next Level', value: `${xpNeeded} XP needed`, inline: true },
                { name: 'Progress', value: `${createProgressBar(progress, progressMax)} ${progress}/${progressMax}`, inline: false }
            )
            .setFooter({ text: 'Meow levels are earned by being active in the server! 🐾' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};