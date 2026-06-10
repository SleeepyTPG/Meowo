const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const { createNotice } = require('../../utils/components');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock a channel to stop new messages')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to lock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
                .setRequired(false),
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the lockdown')
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
        const alreadyLocked = overwrite?.deny?.has(PermissionFlagsBits.SendMessages);

        if (alreadyLocked) {
            const container = createNotice(
                '## 😺 Channel Already Locked',
                `**Channel:** <#${channel.id}>\nThis channel is already in lockdown mode.`,
                '-# Use `/unlock` to reopen chat. 🔓',
                0xFFE08A,
            );
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        await channel.permissionOverwrites.edit(everyoneRoleId, {
            SendMessages: false,
            AddReactions: false,
            SendMessagesInThreads: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
        }, { reason: `${reason} • By ${interaction.user.tag}` });

        const container = createNotice(
            '## 🛡️ Lockdown Enabled',
            `**Channel:** <#${channel.id}>\n**Reason:** ${reason}`,
            '-# Channel is now in cozy quiet mode. 💤',
            0xFFB6C1,
        );

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
