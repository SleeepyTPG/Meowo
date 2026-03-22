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
const { setStreakChannel } = require('../../updates/streaks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-meow-channel')
        .setDescription('Set the channel where meow streaks are tracked')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Text channel for daily meow streak tracking')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel', true);

        await setStreakChannel(interaction.guild.id, channel.id);

        const container = new ContainerBuilder()
            .setAccentColor(0xFFB6C1)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🐱 Meow Channel Updated')
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Meow streaks will now be tracked in <#${channel.id}>.\nSend a message containing **meow** there each day to keep your streak alive!`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('-# Only admins can change this setting. 🛡️')
            );

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
