import mongoose, { Types } from "mongoose";


const tokenSchema = new mongoose.Schema({
    jti: {
        type: String,
        unique: true,
        required:true
    },
    expiresIn: {
        type: Number,
        required:true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }

},
    {
        timestamps: true,
    });
    

export const TokenModel = mongoose.models.Token || mongoose.model("Token", tokenSchema);
TokenModel.syncIndexes();
    