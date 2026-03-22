'use strict';

const { pool } = require('../utils/database');

const MS_PER_HOUR = 1000 * 60 * 60;

// Ensure a row exists for this guild/user before any read-modify-write
async function ensureUser(guildId, userId) {
    await pool.execute(
        'INSERT IGNORE INTO users (guild_id, user_id) VALUES (?, ?)',
        [guildId, userId],
    );
}

async function getUserUnemploymentData(guildId, userId) {
    await ensureUser(guildId, userId);
    const [rows] = await pool.execute(
        'SELECT voice_minutes, voice_join_time, sent_milestones FROM users WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );
    if (!rows[0]) return { totalTime: 0, joinedAt: null, sentMilestones: [] };

    let sentMilestones;
    try {
        sentMilestones = JSON.parse(rows[0].sent_milestones || '[]');
    } catch {
        sentMilestones = [];
    }

    return {
        totalTime: Number(rows[0].voice_minutes),
        joinedAt: rows[0].voice_join_time ? Number(rows[0].voice_join_time) : null,
        sentMilestones,
    };
}

async function setUserJoined(guildId, userId, timestamp) {
    await ensureUser(guildId, userId);
    await pool.execute(
        'UPDATE users SET voice_join_time = ? WHERE guild_id = ? AND user_id = ?',
        [timestamp, guildId, userId],
    );
}

async function addTimeToUser(guildId, userId, timeMs) {
    await ensureUser(guildId, userId);
    const [rows] = await pool.execute(
        'SELECT voice_minutes, sent_milestones FROM users WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );

    const current = rows[0] ?? { voice_minutes: 0, sent_milestones: '[]' };
    let sentMilestones;
    try {
        sentMilestones = JSON.parse(current.sent_milestones || '[]');
    } catch {
        sentMilestones = [];
    }

    const newTotal = Number(current.voice_minutes) + timeMs;
    const totalHours = newTotal / MS_PER_HOUR;
    const milestones = [1, 5, 10, 24, 50, 100, 250, 500, 1000];
    const newMilestones = milestones.filter(m => totalHours >= m && !sentMilestones.includes(m));
    sentMilestones.push(...newMilestones);

    await pool.execute(
        'UPDATE users SET voice_minutes = ?, voice_join_time = NULL, sent_milestones = ? WHERE guild_id = ? AND user_id = ?',
        [newTotal, JSON.stringify(sentMilestones), guildId, userId],
    );

    return { totalTime: newTotal, newMilestones };
}

async function getTotalTime(guildId, userId) {
    const data = await getUserUnemploymentData(guildId, userId);
    return data.totalTime;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

async function getTopUnemployed(guildId, limit = 10) {
    const [rows] = await pool.execute(
        'SELECT user_id, voice_minutes FROM users WHERE guild_id = ? ORDER BY voice_minutes DESC LIMIT ?',
        [guildId, limit],
    );
    return rows.map((row, index) => ({
        id: row.user_id,
        totalTime: Number(row.voice_minutes),
        rank: index + 1,
    }));
}

module.exports = {
    getUserUnemploymentData,
    setUserJoined,
    addTimeToUser,
    getTotalTime,
    formatTime,
    getTopUnemployed,
};
