import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { fetchNfdAddress } from '../../Utils/utils.js';
import axios from 'axios';

const cooldown = 10;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('register')
		.addStringOption(option =>
			option.setName("address")
				.setDescription(`Enter your wallet address`)
				.setRequired(true)
		)
		.setDescription(`Register your Algorand wallet address`)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction) => {
	try {
		await interaction.deferReply({ ephemeral: true })
		let address = interaction.options.getString('address');
		const nfd = await fetchNfdAddress(address);
		if (nfd) {
			address = nfd;
		}

		const userWalletProfile = await profileSchema.findOne({ walletId: address })
		if (userWalletProfile && userWalletProfile.userId === interaction.user.id) {
			return interaction.editReply("You are already registered to this wallet.");
		}

		if (userWalletProfile) {
			return interaction.editReply("Wallet already in use and can not be registered.");
		}

		axios.get(`${process.env.ALGO_EXPLORER_ACCOUNT}${address}/assets`)
			.then(async response => {
				if (!response.data.assets) {
					return interaction.editReply("Invalid algo address");
				}

				const userProfile = await profileSchema.findOne({ userId: interaction.user.id })
				if (userProfile) {
					await profileSchema.updateOne(
						{ userId: interaction.user.id },
						{
							$set: {
								walletId: address
							}
						}).then(async resp => {
							interaction.editReply(`Algo wallet address updated`);
						});
				} else {
					await profileSchema.create({
						userId: interaction.user.id,
						walletId: address
					}).then(async resp => {
						interaction.editReply(`Algo wallet address saved`);
					});
				}
			}).catch((err) => {
				return interaction.editReply("Invalid algo address!");
			});
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again." })
	}
};

export { cooldown, create, invoke };
