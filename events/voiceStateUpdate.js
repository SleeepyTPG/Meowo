const { setUserJoined, addTimeToUser, getUserUnemploymentData, formatTime } = require('../updates/unemployment');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const guild = newState.guild || oldState.guild;
        if (!guild || !newState.member || newState.member.user.bot) return;

        const user = newState.member.user;
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        if (!oldChannel && newChannel) {
            // User joined a voice channel
            await setUserJoined(guild.id, user.id, Date.now());
        } else if (oldChannel && !newChannel) {
            // User left a voice channel
            const userData = await getUserUnemploymentData(guild.id, user.id);
            if (userData.joinedAt) {
                const timeSpent = Date.now() - userData.joinedAt;
                const result = await addTimeToUser(guild.id, user.id, timeSpent);
                if (result.newMilestones.length > 0) {
                    await sendMilestoneDM(user, result.newMilestones, result.totalTime).catch(() => {});
                }
            }
        } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            // User switched voice channels — bank the time and restart the clock
            const userData = await getUserUnemploymentData(guild.id, user.id);
            if (userData.joinedAt) {
                const timeSpent = Date.now() - userData.joinedAt;
                const result = await addTimeToUser(guild.id, user.id, timeSpent);
                if (result.newMilestones.length > 0) {
                    await sendMilestoneDM(user, result.newMilestones, result.totalTime).catch(() => {});
                }
            }
            await setUserJoined(guild.id, user.id, Date.now());
        }
    },
};

async function sendMilestoneDM(user, milestones, totalTime) {
    for (const milestone of milestones) {
        const embed = {
            color: 0xFF69B4,
            title: '🐱 Unemployment Milestone Reached!',
            description: `Congratulations! You've spent **${milestone} hours** being unproductive in voice channels!\n\nTotal time wasted: **${formatTime(totalTime)}**`,
            footer: { text: 'Keep lounging! 🛋️' },
            timestamp: new Date().toISOString(),
        };

        try {
            await user.send({ embeds: [embed] });
        } catch {
            console.log(`Could not send milestone DM to ${user.tag}`);
        }
    }
}
