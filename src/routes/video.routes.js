import {Router} from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js';

import {upload} from '../middlewares/multer.mw.js';
import { verifyJWT } from "../middlewares/auth.mw.js";
 
const router = Router();

// UNSECURED routes
router.route("/").get(getAllVideos)
router.route("watch/:videoId").get(getVideoById)

// SECURED routes

// publish video
router.route("/publish").post(
    verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

// update video details
router.route("/").patch(verifyJWT, updateVideo)

// delete video
router.route("/").delete(verifyJWT, deleteVideo)

// Toggle publish status
router.route("/publish/:id").patch(verifyJWT, togglePublishStatus)



export default router