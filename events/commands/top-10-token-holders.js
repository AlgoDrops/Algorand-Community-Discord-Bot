import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { getTopTokenHolders, ordinal_suffix_of } from '../../Utils/utils.js';

const cooldown = 90;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('top-10-token-holders')
		.setDescription(`Show top 10 ${process.env.TIP_BOT_ASSET_NAME} holders`)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply();
		
		const holders = await getTopTokenHolders();

		let topHolders = []
		let description = ""
		for (const holder of holders) {
			if (topHolders.length >= 10) {
				break;
			}

			const user = await profileSchema.findOne({ walletId: holder.address })
			if (!user) {
				continue;
			}

			const discordUser = await client.users.fetch(user.userId);
			if (!discordUser) {
				continue
			}

			topHolders.push({
				username: discordUser.toString(),
			})
			description += `${await ordinal_suffix_of(topHolders.length)}: ${discordUser.toString()} ${holder.balance} ${process.env.TIP_BOT_ASSET_NAME}\n`
		}

		const embedMessage = new EmbedBuilder()
			.setColor('#e42643')
			.setTitle(`Top 10 ${process.env.TIP_BOT_ASSET_NAME} Holders`)
			.setDescription(description)

		interaction.editReply({ embeds: [embedMessage] })
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again!" })
	}
};

export { cooldown, create, invoke };
