import { v2 as cloudinary } from 'cloudinary';
require('dotenv').config();
import fs from 'fs';


//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

//Whenever we upload stuff thru multer, we get a local file path as returning, so we pass that in this function
const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null;

        //uploading to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            // this auto detects file type 
        }
    );
    console.log("File uploaded on cloudinary", response.url);

    // once the file is uplaoded we would like to delete it from our servers, in node

    fs.unlinkSync(localFilePath);

    return response;

    } catch (error) {
        // if some error happens we will abort uploading and delete file using unlink func
        fs.unlinkSync(localFilePath);
        throw error;
    }
}