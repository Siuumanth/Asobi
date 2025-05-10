import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.mw.js"

const router = Router();

// UNSECURED routes
router.route("/user/:username").get(getUserTweets)

// SECURED routes
router.route("/").post(verifyJWT,createTweet);
router.route("/tweet/:tweetId").delete(verifyJWT,deleteTweet);

export default router