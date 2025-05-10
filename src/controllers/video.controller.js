import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


// unsecure
const getChannelVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query   // getting query parameters
    //TODO: get all videos based on query, sort, pagination

    // page is page number
    // limit is number of videos per page
    // sortBy refers to views, likes , date , etc.
    // sortType is asc or desc

    if(!userId){
        throw new ApiError(400, "User not specified")
    }

    // We will use pagination to fetch the videos

    const videos = await Video.aggregate([
        {
            $match: {
                uploadedBy: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $sort: { createdAt: -1 } 
            //createdAt: -1 — Sorts the documents by the createdAt field in descending order (newest first).
        },
        {
            $skip: (page - 1) * limit // for page n, skip the last (n-1) * limit documents
        },
        {
            $limit: limit 
        }
    ])

    if(!videos){
        throw new ApiError(404, "Videos not found")
    }

    console.log(videos);
    return res.status(200).json(new ApiResponse(true, "Videos fetched successfully", videos))
})

// unsecure
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const videoDoc = await Video.findById(videoId).select("-updatedAt");

    if(!videoDoc){
        throw new ApiError(404, "Video not found");
    }
    
    return res.status(200).json(new ApiResponse(
        200,
        videoDoc,
        "Video fetched successfully"
    ))
})

// unsecure
const getAllVideos = asyncHandler(async (req, res) => {

    // Here, we will just get all the newest first videos for home page
    const { page = 1, limit = 10 } = req.query   

    // We will use pagination to fetch the videos
    
    const videos = await Video.aggregate([
        {
            $sort: { createdAt: -1 } 
        },
        {
            $skip: (page - 1) * limit // for page n, skip the last (n-1) * limit documents
        },
        {
            $limit: limit 
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        }
    ])


    if (!videos || videos.length === 0) {
        throw new ApiError(404, "Videos not found");
    }

    console.log(videos);
    return res.status(200).json(new ApiResponse(
        true,
        "Videos fetched successfully",
        videos
    ))
})




const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration} = req.body;

    if(!title || !description){
        throw new ApiError(400, "Title, description are required");
    }

    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(404, "User not found");
    }

    const videoLocalPath = req.files?.video[0]?.path  
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
        
    if (!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError( 400, "Video file is missing")
    }


    console.log("starting uploading")
    let video;
    try{
        video = await uploadOnCloudinary(videoLocalPath)
        console.log("video uploaded successfully", video)
    }catch(err){
        console.log("Error uploading avatar", err);
        throw new ApiError( 400, "Failed to upload avatar");
    }

    let thumbnail;
    try{
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        console.log("thumbnail uploaded successfully", thumbnail)
    }catch(err){
        console.log("Error uploading Cover", err);
        throw new ApiError( 400, "Failed to upload Cover");
    }

    const videoData = {
        title,
        description,
        duration,
        video: video.url,
        thumbnail: thumbnail.url,
        owner: user._id,
        views: 0,
        isPublished: true
    }

    try {
        const videoDoc = await Video.create(videoData);

        if(!videoDoc){
            throw new ApiError(500, "Failed to create video");
        }
        return res.status(200).json({
            success: true,
            message: "Video uploaded successfully",
            video: videoDoc
        })


    } catch (error) {
        if(video){
            await deleteFromCloudinary(video.public_id)
        }
        if(thumbnail){
            await deleteFromCloudinary(thumbnail.public_id)
        }
        throw new ApiError(500, "Failed to create video");
    }

})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description} = req.body;

    if(!title || !description){
        throw new ApiError(400, "Title, description are required");
    }

    const video = await Video.findByIdAndUpdate(
            req.video._id,
            {
                $set: {
                    title,
                    description
                }
            },
            {new: true}
        ).select("-password")
    
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    
    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video updated successfully"
    ))
})



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id; // assumes auth middleware sets req.user

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // authorization check: only the owner can delete
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await video.deleteOne();

    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Video deleted successfully"
    ));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video publish status toggled successfully"
    ));
});



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}