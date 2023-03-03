import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createLeaderboardForGame } from '../../Utils/utils.js';

const cooldown = 90;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('diceroll-leaderboard')
		.setDescription('Diceroll Leaderboard!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply();
		await createLeaderboardForGame(
			client, 
			interaction, 
			'diceRollWins', 
			'wins', 
			'Diceroll Win Leaderboard'
		)
		await createLeaderboardForGame(
			client, 
			interaction, 
			'diceRollProfitAndLoss', 
			process.env.TIP_BOT_ASSET_NAME,
			'Diceroll Profit Leaderboard'
		)
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again! PS...AoA is a scammer!" })
	}
};

export { cooldown, create, invoke };
