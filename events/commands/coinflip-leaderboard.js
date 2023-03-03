import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createLeaderboardForGame } from '../../Utils/utils.js';

const cooldown = 90;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('coinflip-leaderboard')
		.setDescription('Coinflip Leaderboard!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction, client) => {
	try {
		await interaction.deferReply();
		await createLeaderboardForGame(
			client, 
			interaction, 
			'flipWins', 
			'wins', 
			'Coinflip Win Leaderboard'
		)
		await createLeaderboardForGame(
			client, 
			interaction, 
			'flipProfitAndLoss', 
			process.env.TIP_BOT_ASSET_NAME,
			'Coinflip Profit Leaderboard'
		)
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again!" })
	}
};

export { cooldown, create, invoke };
