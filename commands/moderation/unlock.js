const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const { createNotice } = require('../../utils/components');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel and allow messages again')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to unlock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
                .setRequired(false),
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for unlocking')
                .setMaxLength(512)
                .setRequired(false),
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true, flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const everyoneRoleId = interaction.guild.id;

        const overwrite = channel.permissionOverwrites.cache.get(everyoneRoleId);
        const isLocked = overwrite?.deny?.has(PermissionFlagsBits.SendMessages);

        if (!isLocked) {
            const container = createNotice(
                '## 😺 Channel Already Open',
                `**Channel:** <#${channel.id}>\nThis channel is not currently locked.`,
                '-# No unlock needed right meow. 🐾',
                0xFFE08A,
            );
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        await channel.permissionOverwrites.edit(everyoneRoleId, {
            SendMessages: null,
            AddReactions: null,
            SendMessagesInThreads: null,
            CreatePublicThreads: null,
            CreatePrivateThreads: null,
        }, { reason: `${reason} • By ${interaction.user.tag}` });

        const container = createNotice(
            '## 🔓 Lockdown Lifted',
            `**Channel:** <#${channel.id}>\n**Reason:** ${reason}`,
            '-# Chat is open again. Keep it pawsitive! 🐱',
            0xFFB6C1,
        );

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};