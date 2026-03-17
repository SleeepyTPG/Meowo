const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MessageFlags,
} = require('discord.js');

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

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

function formatDuration(durationMs) {
	const totalMinutes = Math.floor(durationMs / 60000);
	const days = Math.floor(totalMinutes / 1440);
	const hours = Math.floor((totalMinutes % 1440) / 60);
	const minutes = totalMinutes % 60;

	const parts = [];
	if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
	if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
	if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

	return parts.join(', ') || '0 minutes';
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeout (mute) a member for a custom duration')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The member to timeout')
				.setRequired(true),
		)
		.addIntegerOption(option =>
			option
				.setName('days')
				.setDescription('Number of days')
				.setMinValue(0)
				.setMaxValue(28)
				.setRequired(false),
		)
		.addIntegerOption(option =>
			option
				.setName('hours')
				.setDescription('Number of hours')
				.setMinValue(0)
				.setMaxValue(23)
				.setRequired(false),
		)
		.addIntegerOption(option =>
			option
				.setName('minutes')
				.setDescription('Number of minutes')
				.setMinValue(0)
				.setMaxValue(59)
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('Reason for the timeout')
				.setMaxLength(512)
				.setRequired(false),
		),

	async execute(interaction) {
		const targetUser = interaction.options.getUser('user', true);
		const days = interaction.options.getInteger('days') ?? 0;
		const hours = interaction.options.getInteger('hours') ?? 0;
		const minutes = interaction.options.getInteger('minutes') ?? 0;
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const guild = interaction.guild;

		const durationMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);

		if (durationMs <= 0) {
			const container = createNotice(
				'## 😿 Timeout Failed',
				'Please provide a valid duration greater than 0.',
				'-# Example: `/timeout user:@cat minutes:30` 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (durationMs > MAX_TIMEOUT_MS) {
			const container = createNotice(
				'## 😿 Timeout Failed',
				'Timeout duration cannot exceed 28 days.',
				'-# Use a shorter time and try again. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
		if (!targetMember) {
			const container = createNotice(
				'## 😿 Timeout Failed',
				'That user is not currently in this server.',
				'-# I can only timeout current members. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.id === interaction.user.id) {
			const container = createNotice(
				'## 🙀 Timeout Failed',
				'You cannot timeout yourself.',
				'-# Pick another member to moderate. 🐱',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.id === guild.ownerId) {
			const container = createNotice(
				'## 😼 Timeout Failed',
				'The server owner cannot be timed out.',
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
				'## 😿 Timeout Failed',
				'You can only timeout members with a lower top role than yours.',
				'-# Adjust role positions or ask a higher-ranked moderator. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
			const container = createNotice(
				'## 😿 Timeout Failed',
				'Administrators cannot be timed out.',
				'-# Choose a different moderation action if needed. 🛡️',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (!targetMember.moderatable) {
			const container = createNotice(
				'## 😿 Timeout Failed',
				'I cannot timeout that member due to permissions or role hierarchy.',
				'-# Ensure my role is above the target and I have `Moderate Members`. 🛡️',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		await targetMember.timeout(durationMs, `${reason} • By ${interaction.user.tag}`);

		const container = createNotice(
			'## 🐾 Member Timed Out',
			`**User:** <@${targetUser.id}>\n**Duration:** ${formatDuration(durationMs)}\n**Reason:** ${reason}`,
			'-# Temporary quiet time activated. 😴',
			0xFFB6C1,
		);

		return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
	},
};
