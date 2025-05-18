import { Router } from 'express';
import {
    toggleLike,
    getLikedVideos
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.mw.js";

const router = Router();
router.use(verifyJWT); // making all routes secure

// like and unlike
router.route("/toggle/:type/:id").post(toggleLike);

router.route("/videos").get(getLikedVideos);

export default router;
