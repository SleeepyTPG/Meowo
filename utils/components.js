'use strict';

const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require('discord.js');

/**
 * Shared helper for consistent V2 notice containers (success + error states).
 * Used across moderation and set-meow-channel.
 */
function createNotice(title, body, footer, accentColor = 0xFFB6C1) {
    return new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(body))
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footer));
}

/**
 * Shared XP/level progress bar (used by /level and /profile).
 */
function createProgressBar(current, max, length = 10) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

/**
 * Convenience for ephemeral error containers (red accent).
 */
function createErrorNotice(title, body, footer) {
    return createNotice(title, body, footer, 0xF28B82);
}

module.exports = {
    createNotice,
    createProgressBar,
    createErrorNotice,
    MessageFlags, // re-export for convenience in consumers if desired
};
