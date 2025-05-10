import { Router } from 'express';
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.mw.js";

const router = Router();

// get all comments for a video (paginated)
router.route("/comments/:videoId").get(getVideoComments);


router.use(verifyJWT);

// add a comment 
router.route("/comments").post(addComment);

// update a comment
router.route("/comments/:commentId").put(updateComment);

//  delete a comment
router.route("/comments/:commentId").delete(deleteComment);

export default router;
