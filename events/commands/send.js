import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { sendFromReserve, sleep } from '../../Utils/utils.js';

const cooldown = 1800;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('send')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription(`The user you want to send ${process.env.TIP_BOT_ASSET_NAME} to`)
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option.setName("tip")
				.setDescription(`Amount of ${process.env.TIP_BOT_ASSET_NAME} to send`)
				.setMinValue(1)
				.setMaxValue(100000)
				.setRequired(true)
		)
		.setDescription(`Send some ${process.env.TIP_BOT_ASSET_NAME} from the reserve`)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply()
		const checkIfUserAllowedToUseCommand = () => {
			let allowedUsers = process.env.SEND_FROM_RESERVE_USERS.split(" ");

			if (!allowedUsers.includes(interaction.user.id)) {
				return false;
			}

			return true;
		};
		if (!checkIfUserAllowedToUseCommand(interaction)) {
			await interaction.editReply({ content: `Meka Leka Hi...` });
			return
		}

		const userProfile = await profileSchema.findOne({ userId: interaction.user.id })
		if (!userProfile) {
			await interaction.editReply({ content: `Register your wallet with /register command` });
			return;
		}

		const discordTippee = interaction.options.getUser('user');
		const tip = parseInt(interaction.options.getInteger('tip'));

		const userToTipData = await profileSchema.findOne(
			{
				userId: discordTippee.id,
			}
		);
		if (!userToTipData) {
			await interaction.editReply({ content: `Tell your friend ${discordTippee.toString()} to register thier wallet with /register command to receive tip.`});
			return false
		}

		let description = `${tip} ${process.env.TIP_BOT_ASSET_NAME} will be sent soon`
		const embedMessage = new EmbedBuilder()
			.setColor('FFFF00')
			.setTitle(`${process.env.TIP_BOT_ASSET_NAME} Sending`)
			.setImage(process.env.SEND_FROM_RESERVE_GIF)
			.setDescription(
				description
			);

		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(1000)

		let txId = await sendFromReserve(userToTipData.walletId, tip)
		let logMessage = ""
		if (!txId) {
			description += `\nSorry, unable to verify transaction. Please verify wallet for transaction`
			logMessage = `${interaction.user.username}, Unable to verify tip send of ${tip} ${process.env.TIP_BOT_ASSET_NAME}. Please verify wallet for transaction`
		} else {
			description += `\n\n${interaction.user.username} sent ${discordTippee.username} ${tip} ${process.env.TIP_BOT_ASSET_NAME}`;
			if (typeof process.env.SEND_GAME_TX_DM !== "undefined" && process.env.SEND_GAME_TX_DM === "true") {
				description += `\nDM with transaction link will be sent`
			}
			logMessage = `${interaction.user.username} sent ${discordTippee.username} ${tip} ${process.env.TIP_BOT_ASSET_NAME} - ${process.env.EXPLORER_LINK}${txId}`
		}
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })

		if (typeof process.env.SEND_GAME_TX_DM !== "undefined" && process.env.SEND_GAME_TX_DM === "true") {
			try {
				await discordTippee.send(logMessage);
			} catch (err) {
				console.log('user has DMs off for tx', err)
			}
		}
		await client.channels.cache.get(process.env.TX_CHANNEL).send(`${logMessage} from the reserve`)
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
