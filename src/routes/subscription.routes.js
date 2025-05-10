import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.mw.js";

const router = Router();
router.use(verifyJWT); 

// route to toggle subscription to a channel (subscribe or unsubscribe)
router.route("/toggle/subscription/:channelId").post(toggleSubscription);

// route to get the list of subscribers for a particular channel
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);

// route to get the list of channels that a user has subscribed to
router.route("/subscriptions/:subscriberId").get(getSubscribedChannels);

export default router;
