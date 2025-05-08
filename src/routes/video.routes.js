import {Router} from "express";
import {
    publishAVideo,
    getAllVideos
    } from '../controllers/video.controller.js';

import {upload} from '../middlewares/multer.mw.js';
import { verifyJWT } from "../middlewares/auth.mw.js";
 
const router = Router();


// UNSECURED ROUTES, no need verification, anyone can access.
router.route("/publish-video").post(
    upload.fields([   
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), // Here we are injecting the upload middleware to the /register route
    publishAVideo
); 





export default router