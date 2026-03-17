const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require('discord.js');

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel and allow messages again')
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