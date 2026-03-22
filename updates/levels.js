'use strict';

const { pool } = require('../utils/database');

// Ensure a row exists for this guild/user before any read-modify-write
async function ensureUser(guildId, userId) {
    await pool.execute(
        'INSERT IGNORE INTO users (guild_id, user_id) VALUES (?, ?)',
        [guildId, userId],
    );
}

async function getUserData(guildId, userId) {
    await ensureUser(guildId, userId);
    const [rows] = await pool.execute(
        'SELECT xp, level FROM users WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );
    return rows[0] ?? { xp: 0, level: 0 };
}

async function addXP(guildId, userId, amount) {
    await ensureUser(guildId, userId);
    const [rows] = await pool.execute(
        'SELECT xp FROM users WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );
    const newXP = (rows[0]?.xp ?? 0) + amount;
    const newLevel = Math.floor(newXP / 1000);
    await pool.execute(
        'UPDATE users SET xp = ?, level = ? WHERE guild_id = ? AND user_id = ?',
        [newXP, newLevel, guildId, userId],
    );
    return { xp: newXP, level: newLevel };
}

async function giveXPWithCooldown(guildId, userId, amount, cooldownMs = 60000) {
    await ensureUser(guildId, userId);
    const now = Date.now();
    const [rows] = await pool.execute(
        'SELECT xp, level, last_message FROM users WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );
    const user = rows[0] ?? { xp: 0, level: 0, last_message: 0 };

    if (now - Number(user.last_message) < cooldownMs) {
        return false; // Cooldown active
    }

    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 1000);
    await pool.execute(
        'UPDATE users SET xp = ?, level = ?, last_message = ? WHERE guild_id = ? AND user_id = ?',
        [newXP, newLevel, now, guildId, userId],
    );
    return { xp: newXP, level: newLevel, lastMessage: now };
}

function getLevel(xp) {
    return Math.floor(xp / 1000);
}

function getXPForNextLevel(level) {
    return (level + 1) * 1000;
}

async function getRank(guildId, userId) {
    const [rows] = await pool.execute(
        'SELECT user_id FROM users WHERE guild_id = ? ORDER BY xp DESC',
        [guildId],
    );
    const index = rows.findIndex(r => r.user_id === userId);
    return index === -1 ? null : index + 1;
}

async function getTopUsers(guildId, limit = 10) {
    const [rows] = await pool.execute(
        'SELECT user_id, xp, level FROM users WHERE guild_id = ? ORDER BY xp DESC LIMIT ?',
        [guildId, limit],
    );
    return rows.map((row, index) => ({
        id: row.user_id,
        xp: row.xp,
        level: row.level,
        rank: index + 1,
    }));
}

module.exports = {
    getUserData,
    addXP,
    giveXPWithCooldown,
    getLevel,
    getXPForNextLevel,
    getRank,
    getTopUsers,
};
