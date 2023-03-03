import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { capitalizeFirstLetter, checkIfHoldingEnoughToBet, sendOrTakeGamePrize, sleep } from '../../Utils/utils.js';

const cooldown = 1800;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('rps')
		.addStringOption(option =>
			option.setName('guess')
				.setDescription('Your guess of the coin flip')
				.setRequired(true)
				.addChoices(
					{ name: 'Rock', value: 'rock' },
					{ name: 'Paper', value: 'paper' },
					{ name: 'Scissors', value: 'scissors' },
				))
		.addIntegerOption(option =>
			option.setName("bet")
				.setDescription(`Your ${process.env.TIP_BOT_ASSET_NAME} bet on the Rock Paper Scissors`)
				.setMinValue(parseInt(process.env.MIN_RPS_BET))
				.setMaxValue(parseInt(process.env.MAX_RPS_BET))
				.setRequired(true)
		)
		.setDescription(`Your bet on Rock Paper Scissors! ${process.env.MIN_RPS_BET} - ${process.env.MAX_RPS_BET}`)
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

		const guess = interaction.options.getString('guess');
		const bet = parseInt(interaction.options.getInteger('bet'));
		if (!await checkIfHoldingEnoughToBet(interaction, userProfile.walletId, bet)) {
			return;
		}

		const choices = [
			"rock",
			"paper",
			"scissors"
		]
		const botGuess = choices[Math.floor(Math.random() * choices.length)];

		let description = `${bet} ${process.env.TIP_BOT_ASSET_NAME} bet has been placed on Rock Paper Scissors\n\n`
		const embedMessage = new EmbedBuilder()
			.setColor('FFFF00')
			.setTitle("Rock Paper Scissors")
			.setImage(process.env.RPS_GIF)
			.setDescription(
				description
			);

		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(1000)

		description += `${interaction.user.username} threw ${await capitalizeFirstLetter(guess)}\n\n`
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(2000)

		description += `${client.user.username} threw ${await capitalizeFirstLetter(botGuess)}\n\n`
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(1500)

		let result = null
		let color = null;
		if (botGuess === guess) {
			result = "tied"
			color = "#FFD700"
			description += `It's a tie. ${interaction.user.username} and ${client.user.username} both threw ${guess}.\n\n`;
		} else {
			if ((guess === "rock" && botGuess === "scissors") || (guess === "paper" && botGuess === "rock") || (guess === "scissors" && botGuess === "paper")) {
				result = "won"
				color = "#00FF00"
				description += `Congrats ${interaction.user.username} wins! ${bet} ${process.env.TIP_BOT_ASSET_NAME} will be sent to you now\n\n`;
			} else {
				result = "lost"
				color = "#FF0000"
				description += `Sorry you lose. ${bet} ${process.env.TIP_BOT_ASSET_NAME} will be taken from you now\n\n`
			}
		}

		embedMessage.setDescription(description)
		embedMessage.setColor(color)
		await interaction.editReply({ embeds: [embedMessage] })

		if (result === "tied") {
			await profileSchema.updateOne(
				{ userId: userProfile.userId },
				{
					$inc: {
						rpsTies: 1,
					}
				}
			);

			return
		}

		await sendOrTakeGamePrize(client, interaction, userProfile, result, "won", bet, description, embedMessage, color, 'rock paper scissors', 'rpsWins', 'rpsLosses', 'rpsProfitAndLoss')
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
