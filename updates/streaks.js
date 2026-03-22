const fs = require('fs');
const path = require('path');

const streaksPath = path.join(__dirname, 'streaks.json');

function ensureGuildData(data, guildId) {
    if (!data[guildId] || typeof data[guildId] !== 'object') {
        data[guildId] = {};
    }
    if (!data[guildId].config || typeof data[guildId].config !== 'object') {
        data[guildId].config = { streakChannel: null };
    }
    if (!data[guildId].users || typeof data[guildId].users !== 'object') {
        data[guildId].users = {};
    }
    return data[guildId];
}

function ensureUserData(guildData, userId) {
    if (!guildData.users[userId] || typeof guildData.users[userId] !== 'object') {
        guildData.users[userId] = { streak: 0, lastMeow: null };
    }
    return guildData.users[userId];
}

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
    const guildData = ensureGuildData(data, guildId);
    return ensureUserData(guildData, userId);
}

function updateStreak(guildId, userId) {
    const data = loadStreaks();
    const guildData = ensureGuildData(data, guildId);
    const userData = ensureUserData(guildData, userId);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastMeow = userData.lastMeow;

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
            newStreak = userData.streak + 1;
            message = `Streak increased! 🔥`;
        } else if (lastMeow === today) {
            newStreak = userData.streak;
            message = `You've already meowed today! Your streak is safe. 🐱`;
        } else {
            newStreak = 1;
            message = `Streak reset! 😿 Don't worry, start fresh today!`;
        }
    }

    userData.streak = newStreak;
    userData.lastMeow = today;

    saveStreaks(data);
    return { streak: newStreak, message };
}

function getStreak(guildId, userId) {
    return getUserStreakData(guildId, userId).streak;
}

function getTopStreaks(guildId, limit = 10) {
    const data = loadStreaks();
    const guildData = ensureGuildData(data, guildId);

    return Object.entries(guildData.users)
        .sort(([, a], [, b]) => b.streak - a.streak)
        .slice(0, limit)
        .map(([id, stats], index) => ({ id, ...stats, rank: index + 1 }));
}

function getGuildConfig(guildId) {
    const data = loadStreaks();
    const guildData = ensureGuildData(data, guildId);
    return guildData.config;
}

function setStreakChannel(guildId, channelId) {
    const data = loadStreaks();
    const guildData = ensureGuildData(data, guildId);
    guildData.config.streakChannel = channelId;
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