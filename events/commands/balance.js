import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import profileSchema from '../../models/profileSchema.js'
import { fetchUserAssets, getAssetsThatMatchAssetId } from '../../Utils/utils.js';

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('balance')
		.setDescription(`Check ${process.env.TIP_BOT_ASSET_NAME} Balances`)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)

	return command.toJSON();
};

const invoke = async (interaction) => {
	await interaction.deferReply({ ephemeral: true })
	const userProfile = await profileSchema.findOne({ userId: interaction.user.id })
	if (!userProfile) {
		await interaction.editReply({ content: `Register your wallet with /register command`, ephemeral: true });
		return
	}

	const usersAssets = await fetchUserAssets(userProfile.walletId)
	const userThatIsTippingHoldingAmount = await getAssetsThatMatchAssetId(process.env.TIP_BOT_ASSET_ID, usersAssets);
    if (typeof userThatIsTippingHoldingAmount.amount === "undefined" || userThatIsTippingHoldingAmount === []) {
        userThatIsTippingHoldingAmount.amount = 0;
    }

	const embed = new EmbedBuilder()
		.setTitle("Grub Balance")
		.setDescription(`${process.env.TIP_BOT_ASSET_NAME}: ${userThatIsTippingHoldingAmount.amount}`)

	await interaction.editReply({
		embeds: [embed],
		ephemeral: true
	});
};

export { create, invoke };
