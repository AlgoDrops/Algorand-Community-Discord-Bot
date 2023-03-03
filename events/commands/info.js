import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'

const cooldown = 90;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('info')
		.setDescription('Game stats!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction) => {
	try {
		const user = await profileSchema.findOne({ userId: interaction.user.id })
		if (!user) {
			await interaction.reply({ content: `Register your wallet with /register command` });
			return
		}

		const flipWins = user.flipWins ?? 0
		const flipLosses = user.flipLosses ?? 0
		const flipPnl = user.flipProfitAndLoss ?? 0
		const flipGames = flipWins + flipLosses
		let flipPercentage = (flipWins / flipGames) * 100
		if (flipPercentage.toString() === "Infinity") {
			flipPercentage = 100
		}
		if (isNaN(flipPercentage)) {
			flipPercentage = 0
		}

		const diceRollWins = user.diceRollWins ?? 0;
		const diceRollLosses = user.diceRollLosses ?? 0;
		const diceRollTies = user.diceRollTies ?? 0
		const diceRollProfitAndLoss = user.diceRollProfitAndLoss ?? 0;
		const diceGames = diceRollWins + diceRollLosses
		let dicePercentage = (diceRollWins / diceGames) * 100
		if (dicePercentage.toString() === "Infinity") {
			dicePercentage = 100
		}
		if (isNaN(dicePercentage)) {
			dicePercentage = 0
		}

		const rpsWins = user.rpsWins ?? 0;
		const rpsLosses = user.rpsLosses ?? 0;
		const rpsTies = user.rpsTies ?? 0
		const rpsProfitAndLoss = user.rpsProfitAndLoss ?? 0;
		const rpsGames = rpsWins + rpsLosses
		let rpsPercentage = (rpsWins / rpsGames) * 100
		if (rpsPercentage.toString() === "Infinity") {
			rpsPercentage = 100
		}
		if (isNaN(rpsPercentage)) {
			rpsPercentage = 0
		}

		const embedMessage = new EmbedBuilder()
			.setColor('#e42643')
			.setTitle("GAME STATS")
			.setDescription(
				`Coin Flip Wins: ${flipWins}\n`
				+ `Coin Flip Loses: ${flipLosses}\n`
				+ `Coin Flip Profit And Loss: ${flipPnl}\n`
				+ `Coin Flip Win %: ${flipPercentage.toFixed(2)}\n\n`

				+ `Dice Roll Wins: ${diceRollWins}\n`
				+ `Dice Roll Loses: ${diceRollLosses}\n`
				+ `Dice Roll Ties: ${diceRollTies}\n`
				+ `Dice Roll Profit And Loss: ${diceRollProfitAndLoss}\n`
				+ `Dice Roll Win %: ${dicePercentage.toFixed(2)}\n\n`
				
				+ `RPS Wins: ${rpsWins}\n`
				+ `RPS Loses: ${rpsLosses}\n`
				+ `RPS Ties: ${rpsTies}\n`
				+ `RPS Profit And Loss: ${rpsProfitAndLoss}\n`
				+ `RPS Win %: ${rpsPercentage.toFixed(2)}`
			);


		interaction.reply({ embeds: [embedMessage] })
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again!" })
	}
};

export { cooldown, create, invoke };
