import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { checkIfHoldingEnoughToBet, sendOrTakeGamePrize, sleep } from '../../Utils/utils.js';

const cooldown = 1800;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('diceroll')
		.addIntegerOption(option =>
			option.setName("bet")
				.setDescription(`Your ${process.env.TIP_BOT_ASSET_NAME} bet on the ${process.env.DICE_SIDE_COUNT} sided dice roll`)
				.setMinValue(parseInt(process.env.MIN_DICEROLL_BET))
				.setMaxValue(parseInt(process.env.MAX_DICEROLL_BET))
				.setRequired(true)
		)
		.setDescription(`Your bet on the dice roll! ${process.env.MIN_DICEROLL_BET} - ${process.env.MAX_DICEROLL_BET}`)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply()
		const userProfile = await profileSchema.findOne({ userId: interaction.user.id })
		if (!userProfile) {
			await interaction.editReply({ content: `Register your wallet with /register command` });
			return;
		}

		const bet = parseInt(interaction.options.getInteger('bet'));
		if (!await checkIfHoldingEnoughToBet(interaction, userProfile.walletId, bet)) {
			return;
		}

		const userDiceRoll = Math.floor(Math.random() * process.env.DICE_SIDE_COUNT);
		const botDiceRoll = Math.floor(Math.random() * process.env.DICE_SIDE_COUNT);

		let description = `${bet} ${process.env.TIP_BOT_ASSET_NAME} bet has been placed on ${process.env.DICE_SIDE_COUNT} dice roll\n`
		description += `If your roll is higher than ${client.user.username}'s roll you win\n\n`
		const embedMessage = new EmbedBuilder()
			.setColor('FFFF00')
			.setTitle("Dice Roll")
			.setImage(process.env.DICEROLL_GIF)
			.setDescription(
				description
			);

		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(1000)

		description += `${client.user.username} rolls a ${botDiceRoll}\n\n`
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(2000)

		description += `${interaction.user.username} rolls a ${userDiceRoll}\n\n`
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(1500)

		let result = null
		let color = null;
		if (userDiceRoll > botDiceRoll) {
			//win
			result = "won"
			description += `Congrats ${interaction.user.username} wins! ${bet} ${process.env.TIP_BOT_ASSET_NAME} will be sent to you now\n\n`;
			color = "#00FF00"
		} else if (userDiceRoll == botDiceRoll) {
			result = "tied"
			description += `It's a tie. ${interaction.user.username} and ${client.user.username} both rolled a ${userDiceRoll}.\n\n`;
			color = "#FFD700"
			//tie
		} else {
			//loss
			result = "lost"
			description += `Sorry you lose. ${bet} ${process.env.TIP_BOT_ASSET_NAME} will be taken from you now\n\n`
			color = "#FF0000"
		}

		embedMessage.setDescription(description)
		embedMessage.setColor(color)
		await interaction.editReply({ embeds: [embedMessage] })

		if (result === "tied") {
			await profileSchema.updateOne(
				{ userId: userProfile.userId },
				{
					$inc: {
						diceRollTies: 1,
					}
				}
			);

			return
		}

		await sendOrTakeGamePrize(client, interaction, userProfile, result, "won", bet, description, embedMessage, color, 'dice roll', 'diceRollWins', 'diceRollLosses', 'diceRollProfitAndLoss')
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
