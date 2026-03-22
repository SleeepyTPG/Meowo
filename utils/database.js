'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

// Connection pool — shared across the entire process
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'meowo',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    connectionLimit: 8,
    waitForConnections: true,
});

// Verify connectivity on startup; exit early if the database is unreachable
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL connected successfully!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed — bot cannot start without a database:', err.message);
        process.exit(1);
    });

/**
 * Create all required tables if they do not already exist.
 * Call once on bot ready before any DB queries are made.
 */
async function initTables() {
    // Guild settings (meow streak channel)
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS guilds (
            guild_id       VARCHAR(20) PRIMARY KEY,
            meow_channel_id VARCHAR(20) DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Per-user stats — XP/level, voice time, cooldown, milestones
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            guild_id        VARCHAR(20) NOT NULL,
            user_id         VARCHAR(20) NOT NULL,
            level           INT         NOT NULL DEFAULT 0,
            xp              INT         NOT NULL DEFAULT 0,
            last_message    BIGINT      NOT NULL DEFAULT 0,
            voice_minutes   BIGINT      NOT NULL DEFAULT 0,
            voice_join_time BIGINT               DEFAULT NULL,
            sent_milestones TEXT        NOT NULL DEFAULT '[]',
            PRIMARY KEY (guild_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Daily meow streaks
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS streaks (
            guild_id     VARCHAR(20) NOT NULL,
            user_id      VARCHAR(20) NOT NULL,
            last_date    DATE                 DEFAULT NULL,
            streak_count INT         NOT NULL DEFAULT 0,
            PRIMARY KEY (guild_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Database tables initialized!');
}

module.exports = { pool, initTables };
