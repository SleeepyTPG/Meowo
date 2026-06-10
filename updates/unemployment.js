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

/**
 * Reconcile in-progress voice sessions on bot startup.
 * - Banks time for users who had a join_time but are no longer in any VC (covers downtime/restarts).
 * - Ensures users currently in VC have a join_time recorded (so future leave events work).
 * Call once from main.js 'ready' after initTables and guild cache is ready.
 * Best-effort; uses Date.now() for conservative missed time.
 */
async function reconcileVoiceSessions(client) {
    if (!client?.guilds?.cache?.size) return;

    console.log('🔄 Reconciling voice sessions for accuracy across restarts...');

    // 1. Find and bank any stale join_times (users who left while bot was down, or were in VC at last shutdown)
    const [staleRows] = await pool.execute(
        'SELECT guild_id, user_id, voice_join_time FROM users WHERE voice_join_time IS NOT NULL'
    );

    let banked = 0;
    for (const row of staleRows) {
        const gId = row.guild_id;
        const uId = row.user_id;
        const joinedAt = row.voice_join_time ? Number(row.voice_join_time) : null;
        if (!joinedAt) continue;

        const guild = client.guilds.cache.get(gId);
        if (!guild) continue;

        const vs = guild.voiceStates.cache.get(uId);
        const stillInVC = !!(vs && vs.channel);

        if (!stillInVC) {
            // User not present now → bank time up to "now" (when we noticed the end)
            const timeSpent = Date.now() - joinedAt;
            if (timeSpent > 0) {
                try {
                    await addTimeToUser(gId, uId, timeSpent);
                    banked++;
                } catch (e) {
                    console.error(`Reconcile bank error for ${uId} in ${gId}:`, e.message);
                }
            } else {
                // Just clear the stale timestamp
                try {
                    await pool.execute(
                        'UPDATE users SET voice_join_time = NULL WHERE guild_id = ? AND user_id = ?',
                        [gId, uId]
                    );
                } catch {}
            }
        }
    }

    // 2. Ensure all currently active VC users have a join_time (for users who joined while bot was down)
    let started = 0;
    for (const guild of client.guilds.cache.values()) {
        for (const vs of guild.voiceStates.cache.values()) {
            if (!vs.channel || vs.member?.user?.bot) continue;
            const uId = vs.id || vs.member.user.id;
            const data = await getUserUnemploymentData(guild.id, uId).catch(() => ({}));
            if (!data.joinedAt) {
                const ts = vs.joinedTimestamp || Date.now();
                try {
                    await setUserJoined(guild.id, uId, ts);
                    started++;
                } catch (e) {
                    console.error(`Reconcile start error for ${uId}:`, e.message);
                }
            }
        }
    }

    if (banked || started) {
        console.log(`✅ Voice reconcile: banked ${banked} stale session(s), (re)started tracking for ${started} active user(s).`);
    } else {
        console.log('✅ Voice reconcile: no adjustments needed.');
    }
}

module.exports = {
    getUserUnemploymentData,
    setUserJoined,
    addTimeToUser,
    getTotalTime,
    formatTime,
    getTopUnemployed,
    reconcileVoiceSessions,
};
