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
		.setName('kick')
		.setDescription('Kick a member from the server')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The member to kick')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('Reason for the kick')
				.setMaxLength(512)
				.setRequired(false),
		),

	async execute(interaction) {
		const targetUser = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const guild = interaction.guild;

		const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
		if (!targetMember) {
			const container = createNotice(
				'## 😿 Kick Failed',
				'That user is not currently in this server.',
				'-# I can only kick current members. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.id === interaction.user.id) {
			const container = createNotice(
				'## 🙀 Kick Failed',
				'You cannot kick yourself.',
				'-# Pick another member to moderate. 🐱',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (targetMember.id === guild.ownerId) {
			const container = createNotice(
				'## 😼 Kick Failed',
				'The server owner cannot be kicked.',
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
				'## 😿 Kick Failed',
				'You can only kick members with a lower top role than yours.',
				'-# Adjust role order or ask a higher-ranked moderator. 🐾',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		if (!targetMember.kickable) {
			const container = createNotice(
				'## 😿 Kick Failed',
				'I cannot kick that member due to permissions or role hierarchy.',
				'-# Ensure my role is above the target and I have `Kick Members`. 🛡️',
				0xF28B82,
			);
			return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
		}

		await targetMember.kick(`${reason} • By ${interaction.user.tag}`);

		const container = createNotice(
			'## 🐾 Member Kicked',
			`**User:** <@${targetUser.id}>\n**Reason:** ${reason}`,
			'-# Meowo moderation keeps things tidy. ✨',
			0xFFB6C1,
		);

		return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
	},
};
