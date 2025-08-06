import {imageSize} from "image-size";
import fs from "fs";

export const selectImageSize = ({ filePath = "" } = {}) => {
    const buffer = fs.readFileSync(filePath);
    const dimensions = imageSize(buffer);
    console.log(`Width: ${dimensions.width}, Height: ${dimensions.height}`);
    return dimensions;
};


