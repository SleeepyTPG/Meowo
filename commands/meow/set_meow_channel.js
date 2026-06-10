const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags,
} = require('discord.js');
const { setStreakChannel } = require('../../updates/streaks');
const { createNotice } = require('../../utils/components');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-meow-channel')
        .setDescription('Set the channel where meow streaks are tracked')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Text channel for daily meow streak tracking')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            const denied = createNotice(
                '## 😿 Permission Required',
                'You need **Manage Server** permission to change the meow streak channel.',
                '-# Ask a server admin/mod with Manage Server to run this command. 🛡️',
                0xF28B82,
            );
            return interaction.reply({
                components: [denied],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        const channel = interaction.options.getChannel('channel', true);

        await setStreakChannel(interaction.guild.id, channel.id);

        const notice = createNotice(
            '## 🐱 Meow Channel Updated',
            `Meow streaks will now be tracked in <#${channel.id}>.\nSend a message containing **meow** there each day to keep your streak alive!`,
            '-# Only admins can change this setting. 🛡️',
        );

        return interaction.reply({ components: [notice], flags: MessageFlags.IsComponentsV2 });
    },
};
