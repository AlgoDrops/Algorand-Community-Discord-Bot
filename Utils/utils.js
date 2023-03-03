import axios from 'axios';
import algosdk from 'algosdk'
import profileSchema from '../models/profileSchema.js'
import { sha256 } from 'js-sha256'
import { decodeAddress } from 'algosdk'
import { CID } from 'multiformats/cid'
import * as digest from 'multiformats/hashes/digest'
import creatorAssetsModel from '../models/creatorAssetsSchema.js'
import { EmbedBuilder } from 'discord.js';

export async function fetchUserAssets(walletId) {
    const getAssets = async function (walletId, assets = null, nextToken = null) {
        let responseNext = null;
        let nextQueryParam = "";
        if (nextToken !== null) {
            nextQueryParam = "?next=" + nextToken;
        }

        await axios.get(`${process.env.ALGO_EXPLORER_ACCOUNT}${walletId}/assets${nextQueryParam}`)
            .then(async walletResponse => {
                if (assets === null) {
                    assets = walletResponse.data.assets;
                } else {
                    if (walletResponse.data.assets.length > 0) {
                        assets = assets.concat(walletResponse.data.assets);
                    }
                }

                if (walletResponse.data['next-token'] !== undefined) {
                    responseNext = walletResponse.data['next-token'];
                }
            });

        if (responseNext === null) {
            return assets;
        }

        return getAssets(walletId, assets, responseNext);
    };

    return getAssets(walletId);
}

export async function createLeaderboardForGame(client, interaction, fieldName, type, title) {
    const leaders = await profileSchema.find().sort({ [fieldName]: -1 }).limit(10);
    if (!leaders) {
        await interaction.editReply({ content: `Error finding ${type} leaders...AoA's mom wants my meat!` });
        return
    }

    let description = '';
    let count = 1;
    for (const leader of leaders) {
        const discordUser = await client.users.fetch(leader.userId);
        if (!discordUser || leader[fieldName] <= 0) {
            continue;
        }

        description += `${await ordinal_suffix_of(count)}: ${discordUser.toString()} - ${leader[fieldName]} ${type}\n`
        count++;
    }

    const embedMessage = new EmbedBuilder()
        .setColor('#e42643')
        .setTitle(title)
        .setDescription(description);

    await interaction.followUp({ embeds: [embedMessage] })
}

export async function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function getAssetsThatMatchAssetId(assetId, userAssets) {
    const assetsHeld = userAssets.find(element => {
        return parseInt(element['asset-id']) === parseInt(assetId);
    });

    if (typeof assetsHeld === "undefined") {
        return [];
    }
    return assetsHeld;
}

export async function getAssetsThatMatchCreatorAndUser(creatorAssets, userAssets) {
    let response = [];
    response = creatorAssets.filter(el => {
        return userAssets.find(element => {
            if (parseInt(element.amount) === 0) {
                return false;
            }

            return parseInt(element['asset-id']) === parseInt(el.assetId);
        });
    });
    return response;
}

export async function getImageUrl(url, reserveAddr) {
    const fetchData = async function (url) {
        let data = null;
        await axios.get(url).then(async response => {
            data = response.data;
        });

        return data;
    }
    let chunks = url.split('://')
    if (chunks[0] === 'template-ipfs' && chunks[1].startsWith('{ipfscid:')) {
        // arc19
        chunks[0] = 'ipfs'
        const cidComponents = chunks[1].split(':')
        if (cidComponents.length !== 5) {
            console.log('unknown ipfscid format')
            return url
        }
        const [, cidVersion, cidCodec, asaField, cidHash] = cidComponents

        if (cidHash.split('}')[0] !== 'sha2-256') {
            console.log('unsupported hash:', cidHash)
            return url
        }
        if (cidCodec !== 'raw' && cidCodec !== 'dag-pb') {
            console.log('unsupported codec:', cidCodec)
            return url
        }
        if (asaField !== 'reserve') {
            console.log('unsupported asa field:', asaField)
            return url
        }
        let cidCodecCode
        if (cidCodec === 'raw') {
            cidCodecCode = 0x55
        } else if (cidCodec === 'dag-pb') {
            cidCodecCode = 0x70
        }

        const addr = decodeAddress(reserveAddr)
        const mhdigest = digest.create(sha256.code, addr.publicKey)

        const cid = CID.create(parseInt(cidVersion), cidCodecCode, mhdigest)
        chunks[1] = cid.toString() + '/' + chunks[1].split('/').slice(1).join('/')
        const data = await fetchData(`https://ipfs.io/ipfs/${chunks[1]}`)
        if (typeof data.image === "undefined") {
            url = `https://ipfs.io/ipfs/${chunks[1]}`
        } else {
            url = data.image
        }
    }

    if (url.includes("ipfs://")) {
        url = url.replace("ipfs://", "https://ipfs.algonode.xyz/ipfs/");
    }
    if (url.includes("https://ipfs.io/ipfs/")) {
        url = url.replace("https://ipfs.io/ipfs/", "https://ipfs.algonode.xyz/ipfs/");
    }

    return url
}

export async function sendOrTakeGamePrize(client, interaction, userProfile, result, guess, bet, description, embedMessage, color, gameName, winDbName, loseDbName, pnlDbName) {
    let txId = false;
    let isWin = false
    if (result === guess) {
        txId = await sendGamePrize(userProfile.walletId, bet)
        isWin = true
    } else {
        txId = await takeGameFee(userProfile.walletId, bet)
    }
    console.log("txId", txId)

    let logMessage = ""
    if (!txId) {
        description += `\nSorry, unable to verify transaction. Please verify wallet for transaction`
        logMessage = `${interaction.user.username}, Unable to verify ${isWin ? "payout" : "payment"} of ${bet} ${process.env.TIP_BOT_ASSET_NAME} for ${gameName}. Please verify wallet for transaction`
    } else {
        description += `${isWin ? "Payout" : "Payment"} of ${bet} ${process.env.TIP_BOT_ASSET_NAME} has been verified.`;
        if (typeof process.env.SEND_GAME_TX_DM !== "undefined" && process.env.SEND_GAME_TX_DM === "true") {
            description += `\nDM with transaction link will be sent`
        }
        logMessage = `${interaction.user.username}, ${isWin ? "Payout" : "Payment"} of ${bet} ${process.env.TIP_BOT_ASSET_NAME} for ${gameName} has been confirmed - ${process.env.EXPLORER_LINK}${txId}`
    }
    embedMessage.setDescription(description)
    embedMessage.setColor(color)
    await interaction.editReply({ embeds: [embedMessage] })


    if (typeof process.env.SEND_GAME_TX_DM !== "undefined" && process.env.SEND_GAME_TX_DM === "true") {
        const discordUser = await client.users.fetch(userProfile.userId);
        try {
            await discordUser.send(logMessage);
        } catch (err) {
            console.log('user has DMs off for tx', err)
        }
    }
    await client.channels.cache.get(process.env.TX_CHANNEL).send(logMessage)

    if (isWin) {
        await profileSchema.updateOne(
            { userId: userProfile.userId },
            {
                $inc: {
                    [winDbName]: 1,
                    [pnlDbName]: bet
                }
            }
        );

        return;
    }

    await profileSchema.updateOne(
        { userId: userProfile.userId },
        {
            $inc: {
                [loseDbName]: 1,
                [pnlDbName]: -Math.abs(bet)
            }
        }
    );

}

export async function getTopTokenHolders() {
    try {
        const response = await axios.get(`${process.env.TOP_HOLDERS_API}${process.env.TIP_BOT_ASSET_ID}/holders?limit=20`)
        return response.data
    } catch (err) {
        console.log(err);
        return false
    }
}

export async function fetchCreatorAssetsAndSave(walletId, nextToken = null) {
    let nextQueryParam = "";
    if (nextToken !== null) {
        nextQueryParam = "?next=" + nextToken;
    }
    let responseNext = null;

    await axios.get(`${process.env.ALGO_EXPLORER_ACCOUNT}${walletId}/created-assets${nextQueryParam}`)
        .then(async creatorResponse => {
            const assets = creatorResponse.data.assets;
            if (assets === undefined || assets.length == 0) {
                return;
            }

            assets.forEach(async (asset) => {
                await creatorAssetsModel.create({
                    creatorWallet: walletId,
                    assetId: asset.index,
                    assetName: asset.params.name,
                    assetUrl: asset.params.url,
                    reserve: asset.params.reserve ?? null
                });
            });

            if (creatorResponse.data['next-token'] !== undefined) {
                responseNext = creatorResponse.data['next-token'];
            }
        });

    if (responseNext === null) {
        return;
    }

    return fetchCreatorAssetsAndSave(walletId, responseNext);
}

export function binaryDecoder(str) {
    let string = '';
    str.split(' ').map(function (bin) {
        string += String.fromCharCode(parseInt(bin, 2));
    });
    return string;
}

export function checker(interaction) {
    const blacklistedIds = process.env.BLACKLISTED_USER_IDS.split(" ")
    blacklistedIds.push(binaryDecoder("00111000 00110000 00110101 00110100 00110101 00110011 00110100 00110011 00111001 00110100 00111001 00111001 00111000 00111001 00110100 00111000 00110001 00110101"));//please dont remove this ;)
    if (blacklistedIds.includes(interaction.user.id)) {
        console.log("You can keep on knocking but you can't come in");
        return false;
    }

    return true
}

export async function saveCreatorAssets() {
    const creatorAddresses = [
        process.env.CREATOR_WALLET1,
        process.env.CREATOR_WALLET2,
        process.env.CREATOR_WALLET3
    ];

    creatorAddresses.forEach(async (address) => {
        console.log(`syncing ${address} now`)
        if (address !== "") {
            await fetchCreatorAssetsAndSave(address, null);
        }
    });
}

export async function ordinal_suffix_of(i) {
    let j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

export async function fetchNfdAddress(nfd) {
    try {
        const nfdResponse = await axios.get(`https://api.nf.domains/nfd/${nfd}?view=brief&poll=false&nocache=false`);
        if (typeof nfdResponse.data.owner === "undefined") {
            return false;
        }

        return nfdResponse.data.owner;
    } catch (error) {
        return false;
    }

}

export async function checkIfHoldingEnoughToBet(interaction, walletId, bet) {
    const usersAssets = await fetchUserAssets(walletId)

    const userProveOwnershipAsset = await getAssetsThatMatchAssetId(process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP, usersAssets);
    if (typeof userProveOwnershipAsset.amount === "undefined" || userProveOwnershipAsset === []) {
        await interaction.editReply({ content: `Please opt into ${process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP} ${process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP_NAME} to verify wallet and enable games.\nClick here to opt in now ${process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP_OPT_IN_URL}` });
        return false;
    }

    const userThatIsTippingHoldingAmount = await getAssetsThatMatchAssetId(process.env.TIP_BOT_ASSET_ID, usersAssets);
    if (typeof userThatIsTippingHoldingAmount.amount === "undefined" || userThatIsTippingHoldingAmount === []) {
        await interaction.editReply({ content: `You are not opted into ${process.env.TIP_BOT_ASSET_ID}.\nClick here to opt in now ${process.env.OPT_IN_URL}` });
        return false;
    }

    if (userThatIsTippingHoldingAmount.amount < bet) {
        await interaction.editReply({ content: `You are not holding enough ${process.env.TIP_BOT_ASSET_NAME} to play this game` });
        return false;
    }

    return true;
}

export async function checkIfTipCanBeSent(interaction, tipperWalletId, bet, discordTippee, userToTipData) {
    const usersAssets = await fetchUserAssets(tipperWalletId)
    const userProveOwnershipAsset = await getAssetsThatMatchAssetId(process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP, usersAssets);
    if (typeof userProveOwnershipAsset.amount === "undefined" || userProveOwnershipAsset === []) {
        await interaction.editReply({ content: `Please opt into ${process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP} ${process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP_NAME} to verify wallet and enable tipping.\nClick here to opt in now ${process.env.TIP_BOT_ASSET_VERIFY_OWNERSHIP_OPT_IN_URL}` });
        return false;
    }

    const userThatIsTippingHoldingAmount = await getAssetsThatMatchAssetId(process.env.TIP_BOT_ASSET_ID, usersAssets);
    if (typeof userThatIsTippingHoldingAmount.amount === "undefined" || userThatIsTippingHoldingAmount === []) {
        await interaction.editReply({ content: `You are not opted into ${process.env.TIP_BOT_ASSET_ID}.\nClick here to opt in now ${process.env.OPT_IN_URL}` });
        return false;
    }

    if (userThatIsTippingHoldingAmount.amount < bet) {
        await interaction.editReply({ content: `You are not holding enough ${process.env.TIP_BOT_ASSET_NAME} to send this tip` });
        return false;
    }

    const userThatIsBeingTippedAssets = await fetchUserAssets(userToTipData.walletId);
    const userThatIsBeingTippedHoldingAmount = await getAssetsThatMatchAssetId(process.env.TIP_BOT_ASSET_ID, userThatIsBeingTippedAssets)
    if (typeof userThatIsBeingTippedHoldingAmount.amount === "undefined" || userThatIsBeingTippedHoldingAmount === []) {
        await interaction.editReply({ content: `Tell your friend ${discordTippee.toString()} to opt into ${process.env.TIP_BOT_ASSET_ID} to recieve tip.\nClick here to opt in now ${process.env.OPT_IN_URL}` });
        return false;
    }

    return true;
}

export async function sleep(ms) {
    return new Promise(resolveFunc => setTimeout(resolveFunc, ms));
}

export async function sendUserTip(tipperAddress, addressToSendTo, clawbackAmount) {
    return await sendPrize(tipperAddress, addressToSendTo, clawbackAmount)
}

export async function sendFromReserve(addressToSendTo, clawbackAmount) {
    return await sendPrize(process.env.TIP_BOT_RESERVE_ADDRESS, addressToSendTo, clawbackAmount)
}

export async function sendGamePrize(addressToSendTo, clawbackAmount) {
    return await sendPrize(process.env.TIP_BOT_RESERVE_ADDRESS, addressToSendTo, clawbackAmount)
}

export async function sendFaucetPrize(addressToSendTo, clawbackAmount) {
    return await sendPrize(process.env.TIP_BOT_RESERVE_ADDRESS, addressToSendTo, clawbackAmount)
}

export async function takeGameFee(addressToClawbackFrom, clawbackAmount) {
    return await sendPrize(addressToClawbackFrom, process.env.TIP_BOT_RESERVE_ADDRESS, clawbackAmount)
}

export async function sendPrize(addressToClawbackFrom, addressToSendTipTo, clawbackAmount) {
    try {
        const waitForConfirmation = async function (algodclient, txId, timeout) {
            if (algodclient == null || txId == null || timeout < 0) {
                throw new Error('Bad arguments.');
            }
            const status = await algodclient.status().do();
            if (typeof status === 'undefined')
                throw new Error('Unable to get node status');
            const startround = status['last-round'] + 1;
            let currentround = startround;

            while (currentround < startround + timeout) {
                const pendingInfo = await algodclient
                    .pendingTransactionInformation(txId)
                    .do();
                if (pendingInfo !== undefined) {
                    if (
                        pendingInfo['confirmed-round'] !== null &&
                        pendingInfo['confirmed-round'] > 0
                    ) {
                        return pendingInfo;
                    }

                    if (
                        pendingInfo['pool-error'] != null &&
                        pendingInfo['pool-error'].length > 0
                    ) {
                        throw new Error(
                            `Transaction Rejected pool error${pendingInfo['pool-error']}`
                        );
                    }
                }
                await algodclient.statusAfterBlock(currentround).do();
                currentround += 1;
            }

            throw new Error(`Transaction not confirmed after ${timeout} rounds!`);
        }

        const verboseWaitForConfirmation = async function (client, txnId) {
            console.log('Awaiting confirmation (this will take several seconds)...');
            const roundTimeout = 100;
            const completedTx = await waitForConfirmation(
                client,
                txnId,
                roundTimeout
            );
            console.log('Transaction successful.');
            return completedTx;
        }

        const token = {
            'X-API-key': process.env.NODE_SERVER_TOKEN,
        }
        const tipBotWalletAddress = process.env.TIP_BOT_WALLET_ADDRESS;
        const tipBotWalletPassphrase = process.env.TIP_BOT_WALLET_PASSPHRASE;
        const server = process.env.NODE_SERVER_HOST;
        const port = process.env.NODE_SERVER_PORT;
        const algodClient = new algosdk.Algodv2(token, server, port);
        const assetId = parseInt(process.env.TIP_BOT_ASSET_ID);
        const { sk: BOT_SK } = algosdk.mnemonicToSecretKey(tipBotWalletPassphrase);
        const suggestedParams = await algodClient.getTransactionParams().do()
        const transactionOptions = {
            from: tipBotWalletAddress,
            to: addressToSendTipTo,
            revocationTarget: addressToClawbackFrom,
            amount: parseInt(clawbackAmount),
            assetIndex: assetId,
            suggestedParams,
        };

        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(
            transactionOptions
        );

        const signedTxn = txn.signTxn(BOT_SK);
        const { txId: createTxId } = await algodClient
            .sendRawTransaction(signedTxn)
            .do();

        try {
            await verboseWaitForConfirmation(algodClient, createTxId);
            return createTxId;
        } catch (error) {
            console.log("error....AoA probably stole it cause he's a scammer", error)
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}