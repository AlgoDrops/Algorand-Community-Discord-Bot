import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: { type: String, require:true, unique: true },
    walletId: { type: String, require:true },
    flipProfitAndLoss: { type: Number, default: 0 },
    flipWins: { type: Number, default: 0 },
    flipLosses: { type: Number, default: 0 },
    diceRollProfitAndLoss: { type: Number, default: 0 },
    diceRollWins: { type: Number, default: 0 },
    diceRollLosses: { type: Number, default: 0 },
    diceRollTies: { type: Number, default: 0 },
    rpsProfitAndLoss: { type: Number, default: 0 },
    rpsWins: { type: Number, default: 0 },
    rpsLosses: { type: Number, default: 0 },
    rpsTies: { type: Number, default: 0 },
});

const model = mongoose.model("ProfileModel", profileSchema);
export const schema = model.schema
export default model
