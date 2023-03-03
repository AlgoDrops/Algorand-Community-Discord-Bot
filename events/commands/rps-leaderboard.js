import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createLeaderboardForGame } from '../../Utils/utils.js';

const cooldown = 90;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('rps-leaderboard')
		.setDescription('RPS Leaderboard!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply();
		await createLeaderboardForGame(
			client, 
			interaction, 
			'rpsWins', 
			'wins', 
			'RPS Win Leaderboard'
		)
		await createLeaderboardForGame(
			client, 
			interaction, 
			'rpsProfitAndLoss', 
			process.env.TIP_BOT_ASSET_NAME,
			'RPS Profit Leaderboard'
		)
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again! PS...AoA is a thief!" })
	}
};

export { cooldown, create, invoke };
