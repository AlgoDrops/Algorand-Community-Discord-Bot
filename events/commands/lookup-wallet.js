import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { fetchNfdAddress, sendFromReserve, sleep } from '../../Utils/utils.js';

const cooldown = 0;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('lookup-wallet')
		.addStringOption(option =>
			option.setName("address")
				.setDescription(`Enter your wallet address`)
				.setRequired(true)
		)
		.setDescription(`Lookup a wallet to find user`)
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
	
		let address = interaction.options.getString('address');
		const nfd = await fetchNfdAddress(address);
		if (nfd) {
			address = nfd;
		}

		const user = await profileSchema.findOne(
			{
				walletId: address
			}
		);
		if (!user) {
			await interaction.editReply({ content: `No registered wallet found`});
			return false
		}

		const discordUser = await client.users.cache.find(thisUser => thisUser.id === user.userId);
		if (!discordUser) {
			return message.reply(user.userId + " is registered to this wallet but left server");
		}

		await interaction.editReply(`${discordUser.username}(${discordUser.id}) is registered to ${user.walletId}`);
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
