'use strict';

const { pool } = require('../utils/database');

module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        if (!guild?.id) return;
        try {
            // Privacy + maintenance: remove all data for guilds the bot is no longer in.
            // Matches expectations in privacy-policy ("data for that server is automatically deleted within 30 days").
            await pool.execute('DELETE FROM users WHERE guild_id = ?', [guild.id]);
            await pool.execute('DELETE FROM streaks WHERE guild_id = ?', [guild.id]);
            await pool.execute('DELETE FROM guilds WHERE guild_id = ?', [guild.id]);
            console.log(`🗑️ Cleaned data for left guild ${guild.id} (${guild.name || 'unknown'})`);
        } catch (error) {
            console.error(`Failed to clean data for guild ${guild.id}:`, error.message);
        }
    },
};
