import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { fetchUserAssets, getAssetsThatMatchCreatorAndUser, getImageUrl } from '../../Utils/utils.js';
import creatorAssetsModel from '../../models/creatorAssetsSchema.js'

const cooldown = 10;

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('flex')
		.setDescription('Flex 1 of your NFTs by creator!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction) => {
	try {
		await interaction.deferReply();
		const user = await profileSchema.findOne({ userId: interaction.user.id })
		if (!user) {
			await interaction.editReply({ content: `Register your wallet with /register command` });
			return
		}

		const assetsAvailableForFlex = await getAssetsThatMatchCreatorAndUser(
			await creatorAssetsModel.find(
				{ $or: [{ creatorWallet: process.env.CREATOR_WALLET1 }, { creatorWallet: process.env.CREATOR_WALLET2 }, { creatorWallet: process.env.CREATOR_WALLET3 }] }
			).limit(50000),
			await fetchUserAssets(user.walletId)
		);
		const flexAsset = assetsAvailableForFlex[Math.floor(Math.random() * assetsAvailableForFlex.length)]
		if (typeof flexAsset === "undefined") {
			return await interaction.editReply('No assets found for collection in your wallet 😦');
		}

		const imageUrl = await getImageUrl(flexAsset.assetUrl, flexAsset.reserve ?? null)
		if (imageUrl === null || flexAsset.assetName === null) {
			return await interaction.editReply('Sorry error finding asset 😦')
		}

		const embed = new EmbedBuilder()
			.setImage(imageUrl)
			.setTitle(`${flexAsset.assetName}`)

		await interaction.editReply({
			embeds: [embed]
		})
	} catch (err) {
		console.log("error", err)
		await interaction.editReply({ content: "Oops please try again!" })
	}
};

export { cooldown, create, invoke };
