import { CronJob } from "cron";
import { TokenModel } from "../models/Token.model.js";

export const job = new CronJob("0 2 * * *", async function () {
    try {
        const currentDate = Math.floor(Date.now() / 1000);
        const deleteAllExpiredTokens = await TokenModel.deleteMany({ expiresIn: { $lt: currentDate } });
        console.log(`CronJob ${deleteAllExpiredTokens.deletedCount}`);
    } catch (error) {
        console.error('CronJob Fail To Delete All Expired Tokens', error.message);
    }
},
    null,
    true,
    'Africa/Cairo'
);





