// middlewares/validateVideoUpload.js
import path from "path";
import mime from "mime-types";
import { getVideoDurationInSeconds } from "get-video-duration";
import {ApiError} from "../utils/ApiError.js"
import fs from "fs";

export const validateVideoUpload = async (req, res, next) => {
    try {
        const videoFile = req.files?.videoFile?.[0];
        const thumbnailFile = req.files?.thumbnail?.[0];

        if (!videoFile || !thumbnailFile) {
            return next(new ApiError(400, "Video or thumbnail file is missing"));
        }

        // Validate video file
        const videoExt = path.extname(videoFile.originalname).toLowerCase();
        const allowedVideoExts = [".mp4", ".mkv", ".webm"];
        const allowedVideoMimes = ["video/mp4", "video/x-matroska", "video/webm"];

        if (!allowedVideoExts.includes(videoExt) || !allowedVideoMimes.includes(videoFile.mimetype)) {
            fs.unlinkSync(videoFile.path);
            return next(new ApiError(400, "Invalid video file type"));
        }

        // Validate thumbnail
        const thumbExt = path.extname(thumbnailFile.originalname).toLowerCase();
        const allowedImageExts = [".jpg", ".jpeg", ".png"];
        const allowedImageMimes = ["image/jpeg", "image/png"];

        if (!allowedImageExts.includes(thumbExt) || !allowedImageMimes.includes(thumbnailFile.mimetype)) {
            fs.unlinkSync(thumbnailFile.path);
            return next(new ApiError(400, "Invalid thumbnail image type"));
        }

        // Get duration
        try {
            const duration = await getVideoDurationInSeconds(videoFile.path);
            req.body.duration = Math.round(duration);
        } catch (err) {
            return next(new ApiError(400, "Failed to extract video duration"));
        }

        next(); // continue to controller
    } catch (err) {
        console.error("Validation middleware error:", err);
        return next(new ApiError(500, "Error while validating uploaded files"));
    }
};
