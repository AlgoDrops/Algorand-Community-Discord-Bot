import Discord from 'discord.js'; // Works
import { checker } from '../Utils/utils.js';

const once = false;
const name = 'interactionCreate';

async function invoke(interaction, client, cooldowns) {
	if (interaction.isChatInputCommand()) {
		const command = await import(`#commands/${interaction.commandName}`);

		try {
			if (!checker(interaction)) {
				await interaction.reply({ content: `Sorry please wait few mins and try again.` });
				return
			}

			if (!cooldowns.has(interaction.commandName)) {
				cooldowns.set(interaction.commandName, new Discord.Collection());
			}

			const currentTime = Date.now();
			const timeStamps = cooldowns.get(interaction.commandName);
			const cooldownAmount = (command.cooldown) * 1000;
			if (timeStamps.has(interaction.user.id)) {
				const expirationTime = timeStamps.get(interaction.user.id) + cooldownAmount;
				if (currentTime < expirationTime) {
					const timeLeft = (expirationTime - currentTime) / 1000;
					if (timeLeft <= 120) {
						return interaction.reply({
							content: `${timeLeft.toFixed(0)} seconds remaining before next ${interaction.commandName} command use allowed`,
							ephemeral: true
						})
					} else {
						const hours = Math.floor(timeLeft / 60 / 60);
						const minutes = Math.floor(timeLeft / 60) - (hours * 60);
						if (hours === 0) {
							return interaction.reply({
								content: `${minutes} minutes remaining before next ${interaction.commandName} command use allowed`,
								ephemeral: true
							})
						} else {
							return interaction.reply({
								content: `${hours} hours & ${minutes} minutes remaining before next ${interaction.commandName} command use allowed`,
								ephemeral: true
							})
						}
					}
				}
			}

			timeStamps.set(interaction.user.id, currentTime);
			setTimeout(() => timeStamps.delete(interaction.user.id), cooldownAmount);

			if (command) {
				await command.invoke(interaction, client);
			}
		} catch (err) {
			console.log("error", err)
			return;
		}
	}
}

export { once, name, invoke };
