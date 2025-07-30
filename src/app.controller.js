import * as dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.join("./src/config/.env.dev") });
console.log(process.env.PORT);
console.log(process.env.DB_URL);

import express from "express";
import { connectDB } from "./DB/connection.db.js";
import authController from "./modules/auth/auth.controller.js";
import userController from "./modules/user/user.controller.js";
import cors from 'cors';
import { globalErrorHandling } from "./utils/response.js";

async function bootstrap() {
    const app = express();
    const port = process.env.PORT || 5000;

    app.use(cors());
    
    // DB
    await connectDB();


    // Convert Json Buffer
    app.use(express.json());
    
    // Routing;
    app.get("/", (req, res, next) => res.status(200).json({ message: "Welcome To SarahaApp 🔥" }));
    app.use("/auth", authController);
    app.use("/user", userController);
    app.use("{/*dummy}", (req, res, next) => res.status(404).json({ message: "In-Valid App Routing Page ❌" }));

    app.use(globalErrorHandling);
    app.listen(port, () => console.log(`Server Is Running On Port ${port}`));
    
}


export default bootstrap;