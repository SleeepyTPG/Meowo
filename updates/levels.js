const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, 'levels.json');

// Load levels data
function loadLevels() {
    if (fs.existsSync(levelsPath)) {
        try {
            return JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
        } catch (error) {
            console.error('Error loading levels.json:', error);
            return {};
        }
    }
    return {};
}

// Save levels data
function saveLevels(data) {
    try {
        fs.writeFileSync(levelsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving levels.json:', error);
    }
}

// Get user data
function getUserData(guildId, userId) {
    const data = loadLevels();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = { xp: 0, level: 0, lastMessage: 0 };
    return data[guildId][userId];
}

// Add XP to user
function addXP(guildId, userId, amount) {
    const data = loadLevels();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = { xp: 0, level: 0, lastMessage: 0 };

    data[guildId][userId].xp += amount;
    data[guildId][userId].level = Math.floor(data[guildId][userId].xp / 1000);

    saveLevels(data);
    return data[guildId][userId];
}

// Give XP with cooldown
function giveXPWithCooldown(guildId, userId, amount, cooldownMs = 60000) {
    const data = loadLevels();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = { xp: 0, level: 0, lastMessage: 0 };

    const now = Date.now();
    if (now - data[guildId][userId].lastMessage < cooldownMs) {
        return false; // Cooldown active
    }

    data[guildId][userId].xp += amount;
    data[guildId][userId].level = Math.floor(data[guildId][userId].xp / 1000);
    data[guildId][userId].lastMessage = now;

    saveLevels(data);
    return data[guildId][userId];
}

// Get level from XP
function getLevel(xp) {
    return Math.floor(xp / 1000);
}

// Get XP needed for next level
function getXPForNextLevel(level) {
    return (level + 1) * 1000;
}

// Get rank of user in guild
function getRank(guildId, userId) {
    const data = loadLevels();
    if (!data[guildId]) return null;

    const users = Object.entries(data[guildId])
        .sort(([, a], [, b]) => b.xp - a.xp)
        .map(([id], index) => ({ id, rank: index + 1 }));

    const user = users.find(u => u.id === userId);
    return user ? user.rank : null;
}

// Get top users in guild
function getTopUsers(guildId, limit = 10) {
    const data = loadLevels();
    if (!data[guildId]) return [];

    return Object.entries(data[guildId])
        .sort(([, a], [, b]) => b.xp - a.xp)
        .slice(0, limit)
        .map(([id, stats], index) => ({ id, ...stats, rank: index + 1 }));
}

module.exports = {
    loadLevels,
    saveLevels,
    getUserData,
    addXP,
    giveXPWithCooldown,
    getLevel,
    getXPForNextLevel,
    getRank,
    getTopUsers
};