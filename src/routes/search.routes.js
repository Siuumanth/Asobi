import express from "express";
import { searchUsersAndVideos } from "../controllers/search.controller.js";

const router = express.Router();

router.get("", searchUsersAndVideos);

export default router;
