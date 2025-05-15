import {Router} from "express";
import {
    registerUser,
    logoutUser,
    loginUser,
    refreshAccessToken,
    changeCurrentPassword,
    getChannel,
    updateAccountDetails,
    getCurrentUser,
    updateAvatar,
    updateCoverImage,
    getWatchHistory
    } from '../controllers/user.controller.js';

import {upload} from '../middlewares/multer.mw.js';
import { verifyJWT , optionalAuth} from "../middlewares/auth.mw.js";
 
const router = Router();



// Now , whatever controllers we made, we have to define routes for it



// UNSECURED ROUTES, no need verification, anyone can access.
router.route("/register").post(
//means when a POST request is made to /register, run the registerUser function.
    upload.fields([   
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), // Here we are injecting the upload middleware to the /register route
    registerUser
); 

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/channel").get( optionalAuth, getChannel)  // query parameter





// SECURED ROUTES
// We add verifyJWT middleware to all 

// adding middleware and logoutUser is the next() function
router.route("/logout").post(verifyJWT, logoutUser);
// this is how u inject middlewares

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/profile").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar) // as we are expecting a single file, we use single()

router.route("/cover-image").patch(verifyJWT, upload.single("cover-image"), updateCoverImage) // as we are expecting a single file, we use single()

router.route("/history").get(verifyJWT, getWatchHistory)





export default router