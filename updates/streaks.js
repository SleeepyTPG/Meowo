const fs = require('fs');
const path = require('path');

const streaksPath = path.join(__dirname, 'streaks.json');

// Load streaks data
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

// Save streaks data
function saveStreaks(data) {
    try {
        fs.writeFileSync(streaksPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving streaks.json:', error);
    }
}

// Get user data
function getUserStreakData(guildId, userId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    if (!data[guildId].users[userId]) data[guildId].users[userId] = { streak: 0, lastMeow: null };
    return data[guildId].users[userId];
}

// Update streak for user
function updateStreak(guildId, userId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    if (!data[guildId].users[userId]) data[guildId].users[userId] = { streak: 0, lastMeow: null };

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastMeow = data[guildId].users[userId].lastMeow;

    let newStreak;
    let message;

    if (!lastMeow) {
        // First time
        newStreak = 1;
        message = "Welcome to your meow streak! 🐱";
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastMeow === yesterdayStr) {
            // Consecutive day
            newStreak = data[guildId].users[userId].streak + 1;
            message = `Streak increased! 🔥`;
        } else if (lastMeow === today) {
            // Already did today
            newStreak = data[guildId].users[userId].streak;
            message = `You've already meowed today! Your streak is safe. 🐱`;
        } else {
            // Missed days
            newStreak = 1;
            message = `Streak reset! 😿 Don't worry, start fresh today!`;
        }
    }

    data[guildId].users[userId].streak = newStreak;
    data[guildId].users[userId].lastMeow = today;

    saveStreaks(data);
    return { streak: newStreak, message };
}

// Get streak
function getStreak(guildId, userId) {
    return getUserStreakData(guildId, userId).streak;
}

// Get config
function getGuildConfig(guildId) {
    const data = loadStreaks();
    if (!data[guildId]) data[guildId] = { config: { streakChannel: null }, users: {} };
    return data[guildId].config;
}

// Set streak channel
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