import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/v1/search/all?query=something
export const searchUsersAndVideos = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === "") {
        throw new ApiError(400, "Query parameter is required");
    }

    const users = await User.find({
        // options: "i" makes the search case-insensitive
        username: { $regex: query, $options: "i" }
    }).select("_id fullName avatar subsciberCount username");

    const videos = await Video.find({
        title: { $regex: query, $options: "i" }
    }).select("_id title thumbnail views owner");


    if (users.length === 0 && videos.length === 0) {
        throw new ApiError(404, "No results found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { users, videos }, "Search results fetched"));
});
