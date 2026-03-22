'use strict';

const { pool } = require('../utils/database');

// Returns today's date as a YYYY-MM-DD string in UTC
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// Normalise a DATE value returned by mysql2 (may be a Date object or a string)
function toDateString(value) {
    return value instanceof Date ? value.toISOString().split('T')[0] : String(value);
}

async function getUserStreakData(guildId, userId) {
    const [rows] = await pool.execute(
        'SELECT streak_count, last_date FROM streaks WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );
    if (!rows[0]) return { streak: 0, lastMeow: null };
    const lastMeow = rows[0].last_date ? toDateString(rows[0].last_date) : null;
    return { streak: rows[0].streak_count, lastMeow };
}

async function updateStreak(guildId, userId) {
    const today = getTodayString();

    const [rows] = await pool.execute(
        'SELECT streak_count, last_date FROM streaks WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
    );

    let newStreak;
    let message;
    const row = rows[0];

    if (!row || !row.last_date) {
        newStreak = 1;
        message = 'Welcome to your meow streak! 🐱';
    } else {
        const lastDateStr = toDateString(row.last_date);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDateStr === yesterdayStr) {
            newStreak = row.streak_count + 1;
            message = 'Streak increased! 🔥';
        } else if (lastDateStr === today) {
            newStreak = row.streak_count;
            message = "You've already meowed today! Your streak is safe. 🐱";
        } else {
            newStreak = 1;
            message = "Streak reset! 😿 Don't worry, start fresh today!";
        }
    }

    await pool.execute(
        `INSERT INTO streaks (guild_id, user_id, streak_count, last_date)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE streak_count = ?, last_date = ?`,
        [guildId, userId, newStreak, today, newStreak, today],
    );

    return { streak: newStreak, message };
}

async function getStreak(guildId, userId) {
    const data = await getUserStreakData(guildId, userId);
    return data.streak;
}

async function getTopStreaks(guildId, limit = 10) {
    const [rows] = await pool.execute(
        'SELECT user_id, streak_count FROM streaks WHERE guild_id = ? ORDER BY streak_count DESC LIMIT ?',
        [guildId, limit],
    );
    return rows.map((row, index) => ({
        id: row.user_id,
        streak: row.streak_count,
        rank: index + 1,
    }));
}

async function getGuildConfig(guildId) {
    const [rows] = await pool.execute(
        'SELECT meow_channel_id FROM guilds WHERE guild_id = ?',
        [guildId],
    );
    return rows[0] ? { streakChannel: rows[0].meow_channel_id } : { streakChannel: null };
}

async function setStreakChannel(guildId, channelId) {
    await pool.execute(
        `INSERT INTO guilds (guild_id, meow_channel_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE meow_channel_id = ?`,
        [guildId, channelId, channelId],
    );
}

module.exports = {
    getUserStreakData,
    updateStreak,
    getStreak,
    getTopStreaks,
    getGuildConfig,
    setStreakChannel,
};
