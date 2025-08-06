import multer from "multer";
import path from "node:path";
import fs from 'node:fs';
import { log } from "node:console";
import { selectImageSize } from "./image.size.js";

export const fileValidation = {
    image: ['image/jpeg', 'image/gif'],
    document: ['application/pdf', 'application/msword']
};

export const localFieldUpload = ({ customPath = "general", validation = [] } = {}) => {
    let basePath = `uploads/${customPath}`;
   
    const storage = multer.diskStorage({
        destination: function (req, file, callback) {
            
            if (req.user?._id) {
                basePath += `/${req.user._id}`;
            }
            let fullPath = path.resolve(`./src/${basePath}`);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }

            callback(null, path.resolve(fullPath))
        },
        filename: function (req, file, callback) {
            console.log({ file });
            
            const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname;
            file.finalPath = basePath + "/" + uniqueFileName;
            callback(null, uniqueFileName);
        }
    });
    const fileFilter = function (req, file, callback) {
        log({ file });
        if (validation.includes(file.mimetype)) {
            return callback(null, true);
        }
        
        return callback("In-valid File Format", false);
    }
    return multer({
        dest: "./temp",
        fileFilter,
        storage
    })
};


selectImageSize({ filePath: path.resolve('./src/uploads/❛𝐋𝐔𝐍𝐄.jfif') });