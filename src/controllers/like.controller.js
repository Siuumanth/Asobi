import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleLike = asyncHandler(async (req, res) => {
    const { type, documentId } = req.params;

    // validate document ID and type
    if (!isValidObjectId(documentId) || !type) {
        throw new ApiError(400, "Document ID and type are required");
    }

    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "User not found");
    }

    // ensure user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    let originalDoc;

    // fetch the target document based on type

    switch (type) {

        case "video":
            originalDoc = await Video.findById(documentId);
            if (!originalDoc) throw new ApiError(404, "Video not found");
            break;

        case "comment":
            originalDoc = await Comment.findById(documentId);
            if (!originalDoc) throw new ApiError(404, "Comment not found");
            break;

        case "tweet":
            originalDoc = await Tweet.findById(documentId);
            if (!originalDoc) throw new ApiError(404, "Tweet not found");
            break;

        default:
            throw new ApiError(400, "Invalid type");
    }

    // check if user has already liked the document
    const existingLike = await Like.findOne({
        likedBy: userId,
        targetId: documentId,
        targetType: type
    });

    let result;
    let action;

    // like if like doesnt exist
    if (!existingLike) {
        // create a new like
        result = await Like.create({
            likedBy: userId,
            targetId: documentId,
            targetType: type
        });
        action = "liked";
    } 

    
    else {
        
        const deleteResult = await existingLike.deleteOne();

        if (deleteResult.deletedCount === 0) {
            throw new ApiError(400, "Like not found or already removed");
        }

        result = existingLike;
        action = "unliked";
    }

    // return the appropriate response
    return res.status(200).json(new ApiResponse(
        200,
        result,
        `You ${action} the ${type} successfully`
    ));

});


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    
    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: userId,
                targetType: "video",
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "targetId",
                foreignField: "_id",
                as: "video",
            }
        },
        {
            $unwind: "$video"
        },
        {
            $replaceRoot: { newRoot: "$video" }
        }
    ])

    // unwind is used as in each document, by default easch individual video is an array, so we just structure it as a single video

    // we use replaceRoot to replace the root documentID(which is likes ID) with the Video Object ID


    if(!videos || videos.length === 0){
        throw new ApiError(404, "Videos not found")
    }

    return res.status(200).json(new ApiResponse(
        200,
        videos,
        "Videos fetched successfully",
        "success"
    ))
})


export {
    toggleLike,
    getLikedVideos
}