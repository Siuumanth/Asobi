import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';


//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

//Whenever we upload stuff thru multer, we get a local file path as returning, so we pass that in this function

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        console.log("Uploading to cloudinary", localFilePath);
        // Uploading to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded on cloudinary", response.url);

        // Delete the file only if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {
        console.log(`Error in Cloudinary: ${error}`);

        // Delete temp file even on failure
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (fsError) {
            console.log("Error deleting local file", fsError);
        }

        throw error;
    }
};



//Method for deleting image incase of an error 
const deleteFromCloudinary = async (publicId) => {
    try{
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary, publicID:", publicId)
    } catch(error){
        console.log("Error deleting from cloudinary",error)
        return null;
    }
}


export {
    uploadOnCloudinary,deleteFromCloudinary
}