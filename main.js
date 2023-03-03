import { } from 'dotenv/config';
import fs from 'fs';
import discord from 'discord.js';
const { Client, GatewayIntentBits } = discord
import mongoose from 'mongoose';
import creatorAssetsSchema from './models/creatorAssetsSchema.js'
import { saveCreatorAssets } from './Utils/utils.js';

const cooldowns = new Map();
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions
	]
});

const events = fs
	.readdirSync('./events')
	.filter((file) => file.endsWith('.js'));

for (let event of events) {
	const eventFile = await import(`#events/${event}`);
	if (eventFile.once) {
		client.once(eventFile.name, (...args) => {
			eventFile.invoke(...args, client, cooldowns);
		});

		continue
	}

	client.on(eventFile.name, (...args) => {
		eventFile.invoke(...args, client, cooldowns);
	});
}

mongoose.connect(process.env.MONGO_SRV, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(async () => {
	console.log("Connected to DB");
	const creatorAssets = await creatorAssetsSchema.findOne()
	if (!creatorAssets) {
		console.log("Syncing creator assets now. One moment...");
		await saveCreatorAssets()
		console.log("Done syncing assets");
	}
}).catch((err) => {
	console.log(err);
});

process.on("unhandledRejection", async (err) => {
	console.error("Unhandled Promise Rejection:\n", err);
});
process.on("uncaughtException", async (err) => {
	console.error("Uncaught Promise Exception:\n", err);
});
process.on("uncaughtExceptionMonitor", async (err) => {
	console.error("Uncaught Promise Exception (Monitor):\n", err);
});

client.login(process.env.DISCORD_TOKEN);
