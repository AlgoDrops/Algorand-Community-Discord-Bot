import { SlashCommandBuilder } from 'discord.js';

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replys with Pong!')

	return command.toJSON();
};

const invoke = async (interaction) => {
	interaction.reply({
		content: 'Pong Mother Fucker! PONG! (In Samuel L. Jackson voice)',
	});
};

export { create, invoke };
