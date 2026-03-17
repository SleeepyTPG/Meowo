const fs = require('fs');
const path = require('path');

const unemploymentPath = path.join(__dirname, 'unemployment.json');

function loadUnemployment() {
    if (fs.existsSync(unemploymentPath)) {
        try {
            return JSON.parse(fs.readFileSync(unemploymentPath, 'utf8'));
        } catch (error) {
            console.error('Error loading unemployment.json:', error);
            return {};
        }
    }
    return {};
}

function saveUnemployment(data) {
    try {
        fs.writeFileSync(unemploymentPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving unemployment.json:', error);
    }
}

function getUserUnemploymentData(guildId, userId) {
    const data = loadUnemployment();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = { totalTime: 0, joinedAt: null, sentMilestones: [] };
    return data[guildId][userId];
}

function setUserJoined(guildId, userId, timestamp) {
    const data = loadUnemployment();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = { totalTime: 0, joinedAt: null, sentMilestones: [] };
    data[guildId][userId].joinedAt = timestamp;
    saveUnemployment(data);
}

function addTimeToUser(guildId, userId, timeMs) {
    const data = loadUnemployment();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = { totalTime: 0, joinedAt: null, sentMilestones: [] };

    data[guildId][userId].totalTime += timeMs;
    data[guildId][userId].joinedAt = null; // Reset join time

    const totalHours = data[guildId][userId].totalTime / (1000 * 60 * 60);
    const milestones = [1, 5, 10, 24, 50, 100, 250, 500, 1000]; // Hours
    const newMilestones = milestones.filter(m => totalHours >= m && !data[guildId][userId].sentMilestones.includes(m));

    data[guildId][userId].sentMilestones.push(...newMilestones);

    saveUnemployment(data);
    return { totalTime: data[guildId][userId].totalTime, newMilestones };
}

function getTotalTime(guildId, userId) {
    return getUserUnemploymentData(guildId, userId).totalTime;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function getTopUnemployed(guildId, limit = 10) {
    const data = loadUnemployment();
    if (!data[guildId]) return [];

    return Object.entries(data[guildId])
        .sort(([, a], [, b]) => b.totalTime - a.totalTime)
        .slice(0, limit)
        .map(([id, stats], index) => ({ id, ...stats, rank: index + 1 }));
}

module.exports = {
    loadUnemployment,
    saveUnemployment,
    getUserUnemploymentData,
    setUserJoined,
    addTimeToUser,
    getTotalTime,
    formatTime,
    getTopUnemployed
};