import {Router} from "express";
import {registerUser} from '../controllers/user.controller.js';

import {upload} from '../middlewares/multer.mw.js';
 
const router = Router();

//means when a POST request is made to /register, run the registerUser function.
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
); 

export default router