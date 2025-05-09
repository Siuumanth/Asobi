import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Video} from "../models/video.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Video id not provided")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found")
    }
    
    // getting comments based on pages and limit

    const comments = await Comment.find({
        targetId: videoId,
        targetType: "video"
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("owner", "username avatar"); 
    
    // We use populate so that we can get more details like username and avatar in the response, other than just user ID

    if(!comments || comments.length === 0){
        throw new ApiError(404, "Comments not found")
    }
    
    return res.status(200).json(new ApiResponse(
        200,
        comments,
        "Comments fetched successfully"
    ))

})


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const {videoId, comment} = req.body;

    if(!videoId || !comment){
        throw new ApiError(400, "Video id and comment are required")
    }

    const video = await Video.findOne(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const commentData = {
        owner: userId,
        targetId : videoId,
        content: comment,
        targetType: "video",

    }

    const commentDoc = await Comment.create(commentData);
    return res.status(200).json(new ApiResponse(
        200,
        commentDoc,
        "Comment added successfully"
    ))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {comment} = req.body;
    const { userId } = req.user?._id;

    if(!comment || !userId){
        throw new ApiError(400, "Comment and owner are required")
    }

    const newComment = await Comment.findOneAndUpdate({
        _id: commentId,
        owner: userId
    }, {
        content: comment
    }, {
        new: true
    })

    if(!newComment){
        throw new ApiError(404, "Comment not found")
    }

    return res.status(200).json(new ApiResponse(
        200,
        newComment,
        "Comment updated successfully"
    ))
})


const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    const { userId } = req.user?._id;

    if(!owner || !userId){
        throw new ApiError(400, "Owner is required")
    }

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner : userId
    })

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    return res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
        data: comment,
        code: 200,
        status: "success",
    })
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }