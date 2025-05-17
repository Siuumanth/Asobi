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
router.route("/:videoId").get(getVideoComments);


router.use(verifyJWT);

// add a comment 
router.route("/add").post(addComment);

// update a comment
router.route("/update/:commentId").put(updateComment);

//  delete a comment
router.route("/del/:commentId").delete(deleteComment);

export default router;
