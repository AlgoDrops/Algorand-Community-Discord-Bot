import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { sendFromReserve, sleep } from '../../Utils/utils.js';

const cooldown = 0;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('lookup-user')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription(`The user you want to lookup`)
				.setRequired(true)
		)
		.setDescription(`Lookup a users wallete`)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply()
		if (!interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID)) {
			await interaction.editReply({ content: `Meka Leka Hi...You not allowed to use` });
			return;
		}
	
		const discordUser = interaction.options.getUser('user');
		const user = await profileSchema.findOne(
			{
				userId: discordUser.id,
			}
		);
		if (!user) {
			await interaction.editReply({ content: `No registered user found`});
			return false
		}

		await interaction.editReply(`${discordUser.username}(${discordUser.id}) is registered to ${user.walletId}`);
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
