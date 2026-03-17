const fs = require('fs');
const path = require('path');

const streaksPath = path.join(__dirname, 'streaks.json');

function loadStreaks() {
    if (fs.existsSync(streaksPath)) {
        try {
            return JSON.parse(fs.readFileSync(streaksPath, 'utf8'));
        } catch (error) {
            console.error('Error loading streaks.json:', error);
            return {};
        }
    }
    return {};
}

function saveStreaks(data) {
    try {
        fs.writeFileSync(streaksPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving streaks.json:', error);
    }
}

function getUserStreakData(guildId, userId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    if (!data[guildId].users[userId]) data[guildId].users[userId] = { streak: 0, lastMeow: null };
    return data[guildId].users[userId];
}

function updateStreak(guildId, userId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    if (!data[guildId].users[userId]) data[guildId].users[userId] = { streak: 0, lastMeow: null };

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastMeow = data[guildId].users[userId].lastMeow;

    let newStreak;
    let message;

    if (!lastMeow) {
        newStreak = 1;
        message = "Welcome to your meow streak! 🐱";
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastMeow === yesterdayStr) {
            newStreak = data[guildId].users[userId].streak + 1;
            message = `Streak increased! 🔥`;
        } else if (lastMeow === today) {
            newStreak = data[guildId].users[userId].streak;
            message = `You've already meowed today! Your streak is safe. 🐱`;
        } else {
            newStreak = 1;
            message = `Streak reset! 😿 Don't worry, start fresh today!`;
        }
    }

    data[guildId].users[userId].streak = newStreak;
    data[guildId].users[userId].lastMeow = today;

    saveStreaks(data);
    return { streak: newStreak, message };
}

function getStreak(guildId, userId) {
    return getUserStreakData(guildId, userId).streak;
}

function getTopStreaks(guildId, limit = 10) {
    const data = loadStreaks();
    if (!data[guildId] || !data[guildId].users) return [];

    return Object.entries(data[guildId].users)
        .sort(([, a], [, b]) => b.streak - a.streak)
        .slice(0, limit)
        .map(([id, stats], index) => ({ id, ...stats, rank: index + 1 }));
}

function getGuildConfig(guildId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    return data[guildId].config;
}

function setStreakChannel(guildId, channelId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    data[guildId].config.streakChannel = channelId;
    saveStreaks(data);
}

module.exports = {
    loadStreaks,
    saveStreaks,
    getUserStreakData,
    updateStreak,
    getStreak,
    getTopStreaks,
    getGuildConfig,
    setStreakChannel
};