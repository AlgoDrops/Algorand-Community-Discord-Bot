import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { sendFaucetPrize, sleep } from '../../Utils/utils.js';

const cooldown = 720;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Token faucet!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply();
		const user = await profileSchema.findOne({ userId: interaction.user.id })
		if (!user) {
			await interaction.editReply({ content: `Register your wallet with /register command` });
			return
		}

		let description = `Turning on the ${process.env.TIP_BOT_ASSET_NAME} faucet`;
		const embedMessage = new EmbedBuilder()
			.setColor('FFFF00')
			.setTitle(`${process.env.TIP_BOT_ASSET_NAME} Faucet`)
			.setImage(process.env.FAUCET_GIF)
			.setDescription(
				description
			);
		await interaction.editReply({ embeds: [embedMessage] })

		await sleep(2000);
		let amount = Math.floor(Math.random() * process.env.FAUCET_MAX)
		if (amount < process.env.FAUCET_MIN) {
			amount = process.env.FAUCET_MIN
		}

		description += `\n\n${amount} ${process.env.TIP_BOT_ASSET_NAME} will be sent soon`
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })
		
		const txId = await sendFaucetPrize(user.walletId, parseInt(amount))
		let logMessage = ""
		if (!txId) {
			description += `\n\nSorry, unable to verify transaction. Please verify wallet for transaction`
			logMessage = `${interaction.user.username}, Unable to verify faucet payout of ${amount} ${process.env.TIP_BOT_ASSET_NAME}. Please verify wallet for transaction`
		} else {
			description += `\n\nFaucet payment of ${amount} ${process.env.TIP_BOT_ASSET_NAME} has been verified.`;
			if (typeof process.env.SEND_GAME_TX_DM !== "undefined" && process.env.SEND_GAME_TX_DM === "true") {
				description += `\nDM with transaction link will be sent`
			}
			logMessage = `${interaction.user.username}, faucet payout of ${amount} ${process.env.TIP_BOT_ASSET_NAME} has been confirmed - ${process.env.EXPLORER_LINK}${txId}`
		}

		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })

		if (typeof process.env.SEND_GAME_TX_DM !== "undefined" && process.env.SEND_GAME_TX_DM === "true") {
			const discordUser = await client.users.fetch(user.userId);
			try {
				await discordUser.send(logMessage);
			} catch (err) {
				console.log('user has DMs off for tx', err)
			}
		}
		await client.channels.cache.get(process.env.TX_CHANNEL).send(logMessage)
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again!" })
	}
};

export { cooldown, create, invoke };
