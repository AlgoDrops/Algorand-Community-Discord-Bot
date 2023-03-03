import mongoose from 'mongoose';

const creatorAssetsSchema = new mongoose.Schema({
    creatorWallet: { type: String, require:true },
    assetId: { type: String, require:true },
    assetName: { type: String, require:true },
    assetUrl: { type: String, require:true },
    reserve: { type: String }
});

const model = mongoose.model("CreatorAssetsModel", creatorAssetsSchema);
export const schema = model.schema
export default model
