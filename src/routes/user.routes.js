import {Router} from "express";
import {registerUser, logoutUser} from '../controllers/user.controller.js';

import {upload} from '../middlewares/multer.mw.js';
import { verifyJWT } from "../middlewares/auth.mw.js";
 
const router = Router();

//means when a POST request is made to /register, run the registerUser function.
router.route("/register").post(
    upload.fields([    // Here we are injecting the upload middleware to the /register route
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
); 


//secured route
// adding middleware and logoutUser is the next() function

router.route("/logout").post(verifyJWT, logoutUser);

//router.route("/logout").post(verifyJWT,/*Any function can be added here*/ logoutUser);
// this is how u inject middlewares

export default router