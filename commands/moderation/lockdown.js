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
		.setName('lockdown')
		.setDescription('Lock a channel to stop new messages')
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
