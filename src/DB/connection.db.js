import mongoose from "mongoose";
export const connectDB = async () => {
    try {
        const URI = process.env.DB_URL;
        const result = await mongoose.connect(URI, { serverSelectionTimeoutMS: 30000 });
        console.log(result.models);
        console.log("DB Connected Successfully ✔");
    
    } catch (error) {
        console.log("DB Fail To Connect ❓", error);
    }

}
