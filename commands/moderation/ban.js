const {
	SlashCommandBuilder,
	PermissionFlagsBits,
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
		.setName('ban')
		.setDescription('Ban a member from the server')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The member to ban')
				.setRequired(true),
		)
		.addIntegerOption(option =>
			option
				.setName('delete_days')
				.setDescription('Delete up to 7 days of message history')
				.setMinValue(0)
				.setMaxValue(7)
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('Reason for the ban')
				.setMaxLength(512)
				.setRequired(false),
		),

	async execute(interaction) {
		const targetUser = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const deleteDays = interaction.options.getInteger('delete_days') ?? 0;
		const guild = interaction.guild;

		const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

		if (!targetMember) {
			const container = createNotice(
				'## 😿 Ban Failed',
				'That user is not currently in this server, so I cannot run member safety checks before banning.',
				'-# Ask them to join first, then try again for a safe ban flow. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.id === interaction.user.id) {
			const container = createNotice(
				'## 🙀 Ban Failed',
				'You cannot ban yourself, silly cat.',
				'-# Try targeting another member. 🐱',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.id === guild.ownerId) {
			const container = createNotice(
				'## 😼 Ban Failed',
				'The server owner cannot be banned.',
				'-# Discord hierarchy rules protect the server owner. 🛡️',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (
			interaction.member.id !== guild.ownerId
			&& targetMember.roles.highest.position >= interaction.member.roles.highest.position
		) {
			const container = createNotice(
				'## 😿 Ban Failed',
				'You can only ban members with a lower top role than yours.',
				'-# Move role positions or ask a higher-ranked moderator. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (!targetMember.bannable) {
			const container = createNotice(
				'## 😿 Ban Failed',
				'I cannot ban that member due to Discord permissions or role hierarchy.',
				'-# Ensure my role is above the target and I have `Ban Members`. 🛡️',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		await guild.members.ban(targetUser.id, {
			reason: `${reason} • By ${interaction.user.tag}`,
			deleteMessageSeconds: deleteDays * 24 * 60 * 60,
		});

		const container = createNotice(
			'## 🐾 Member Banned',
			`**User:** <@${targetUser.id}>\n**Reason:** ${reason}\n**Deleted Messages:** ${deleteDays} day${deleteDays !== 1 ? 's' : ''}`,
			'-# Meowo moderation keeps the server cozy. 🛡️',
			0xFFB6C1,
		);

		return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
	},
};
