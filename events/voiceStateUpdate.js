const { setUserJoined, addTimeToUser, getUserUnemploymentData } = require('../updates/unemployment');

module.exports = {
    name: 'voiceStateUpdate',
    execute(oldState, newState) {
        const user = newState.member.user;
        if (user.bot) return;

        const guild = newState.guild;
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        if (!oldChannel && newChannel) {
            setUserJoined(guild.id, user.id, Date.now());
        }
        else if (oldChannel && !newChannel) {
            const userData = getUserUnemploymentData(guild.id, user.id);
            if (userData.joinedAt) {
                const timeSpent = Date.now() - userData.joinedAt;
                const result = addTimeToUser(guild.id, user.id, timeSpent);

                if (result.newMilestones.length > 0) {
                    sendMilestoneDM(user, result.newMilestones, result.totalTime);
                }
            }
        }
        else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            const userData = getUserUnemploymentData(guild.id, user.id);
            if (userData.joinedAt) {
                const timeSpent = Date.now() - userData.joinedAt;
                const result = addTimeToUser(guild.id, user.id, timeSpent);

                if (result.newMilestones.length > 0) {
                    sendMilestoneDM(user, result.newMilestones, result.totalTime);
                }
            }
            setUserJoined(guild.id, user.id, Date.now());
        }
    },
};

async function sendMilestoneDM(user, milestones, totalTime) {
    const { formatTime } = require('../updates/unemployment');

    for (const milestone of milestones) {
        const embed = {
            color: 0xFF69B4,
            title: '🐱 Unemployment Milestone Reached!',
            description: `Congratulations! You've spent **${milestone} hours** being unproductive in voice channels!\n\nTotal time wasted: **${formatTime(totalTime)}**`,
            footer: { text: 'Keep lounging! 🛋️' },
            timestamp: new Date().toISOString()
        };

        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            console.log(`Could not send milestone DM to ${user.tag}`);
        }
    }
}