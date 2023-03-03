import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { checkIfHoldingEnoughToBet, sendOrTakeGamePrize, sleep } from '../../Utils/utils.js';

const cooldown = 1800;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('coinflip')
		.addStringOption(option =>
			option.setName('guess')
				.setDescription('Your guess of the coin flip')
				.setRequired(true)
				.addChoices(
					{ name: 'Heads', value: 'heads' },
					{ name: 'Tails', value: 'tails' },
				))
		.addIntegerOption(option =>
			option.setName("bet")
				.setDescription(`Your ${process.env.TIP_BOT_ASSET_NAME} bet on the coin flip`)
				.setMinValue(parseInt(process.env.MIN_COINFLIP_BET))
				.setMaxValue(parseInt(process.env.MAX_COINFLIP_BET))
				.setRequired(true)
		)
		.setDescription(`Your bet on the coin flip! ${process.env.MIN_COINFLIP_BET} - ${process.env.MAX_COINFLIP_BET}`)
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

		const options = [
			"heads",
			"tails"
		];
		const guess = interaction.options.getString('guess');
		const bet = parseInt(interaction.options.getInteger('bet'));
		if (!options.includes(guess)) {
			await interaction.editReply({ content: `Please choose heads or tails` });
		}

		if (!await checkIfHoldingEnoughToBet(interaction, userProfile.walletId, bet)) {
			return
		}

		let description = `${bet} ${process.env.TIP_BOT_ASSET_NAME} bet has been placed on coin flip for ${guess}\n\n`
		const embedMessage = new EmbedBuilder()
			.setColor('FFFF00')
			.setTitle("Coin Flip")
			.setImage(process.env.COINFLIP_GIF)
			.setDescription(
				description
			);

		await interaction.editReply({ embeds: [embedMessage] })
		await sleep(1000)

		description += `Coin is in the air flipping now. Good Luck!\n\n`
		embedMessage.setDescription(description)
		await interaction.editReply({ embeds: [embedMessage] })

		await sleep(1500)
		let color = ""
		const flipResult = options[Math.floor(Math.random() * options.length)];
		if (flipResult === guess) {
			color = "#00FF00"
			description += `Congrats you win! ${bet} ${process.env.TIP_BOT_ASSET_NAME} will be sent to you now\n\n`
		} else {
			color = "#FF0000"
			description += `Sorry you lose! ${bet} ${process.env.TIP_BOT_ASSET_NAME} will be taken from you now\n\n`
		}
		embedMessage.setDescription(description)
		embedMessage.setColor(color)
		await interaction.editReply({ embeds: [embedMessage] })

		await sendOrTakeGamePrize(client, interaction, userProfile, flipResult, guess, bet, description, embedMessage, color, 'coinflip', 'flipWins', 'flipLosses', 'flipProfitAndLoss')
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
