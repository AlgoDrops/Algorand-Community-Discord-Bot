import fs from 'fs';

const once = true;
const name = 'ready';

async function invoke(client) {
	const commands = fs
		.readdirSync('./events/commands')
		.filter((file) => file.endsWith('.js'))
		.map((file) => file.slice(0, -3));

	const commandsArray = [];

	for (let command of commands) {
		const commandFile = await import(`#commands/${command}`);
		commandsArray.push(commandFile.create());
	}

	client.application.commands.set(commandsArray);
	console.log(`Logged in as ${client.user.tag}!\nYour mom loves ALGO more than you!`);
}

export { once, name, invoke };
