import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteFromCloudinary} from "../utils/cloudinary.js"


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
    const { v } = req.query

    if(!isValidObjectId(v)){
        throw new ApiError(400, "Invalid video id");
    }

    const videoDoc = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(v),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $project: {
                owner: { 
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    subscriberCount: 1
                },
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                video: 1,
                views: 1,
                isPublished: 1
            },  
        }
    ])

    if(!videoDoc){
        throw new ApiError(404, "Video not found");
    }
    
    const updated = await Video.findByIdAndUpdate(v, {
        $inc: {
            views: 1
        }
    })

    if(!updated){
        console.log("Bro updated views")
    }
    
    return res.status(200).json(new ApiResponse(
        200,
        videoDoc,
        "Video fetched successfully"
    ))
})

// unsecure
const getAllVideos = asyncHandler(async (req, res) => {
 console.log("requewt recieved to fetch  all videos")
    // Here, we will just get all the newest first videos for home page
    const { pageTemp = 1, limitTemp = 10 } = req.query  

    const page = Number(pageTemp);
    const limit = Number(limitTemp);
    // We will use pagination to fetch the videos

    const videos = await Video.aggregate([
        {
            $match: {
                isPublished: true,
            },
        },
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
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                owner: {
                    _id: "$owner._id",
                    fullName: "$owner.fullName",
                    username: "$owner.username",
                    avatar: "$owner.avatar",
                    coverImage: "$owner.coverImage",
                }
            }
        }
    ])


    if (!videos || videos.length === 0) {
        throw new ApiError(404, "Videos not found HAHAh");
    }

    if(videos){
        console.log("found");
    }
    return res.status(200).json(new ApiResponse(
        true,
        videos,
        "Videos fetched successfully heheheh"
    ))
})




const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration} = req.body;

    if(!title || !description){
        console.log("Title, description are required")
        throw new ApiError(400, "Title, description are required");
    }
    console.log("Publish video received")


    console.log("User id", req.user?._id)
    const user = await User.findById(req.user?._id)
    if(!user){
        console.log("User not found");
        throw new ApiError(404, "User not found");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path  
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
        
    if (!videoLocalPath || !thumbnailLocalPath){
        console.log("Video file is missing")
        throw new ApiError( 400, "Video file is missing")
    }

    console.log("starting uploading")
    let video;
    try{
        video = await uploadOnCloudinary(videoLocalPath)
        console.log("video uploaded successfully")
    }catch(err){
        console.log("Error uploading avatar", err);
        throw new ApiError( 400, "Failed to upload avatar");
    }
    console.log("video is uploaded")

    let thumbnail;
    try{
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        console.log("thumbnail uploaded successfully")
    }catch(err){
        console.log("Error uploading Cover", err);
        throw new ApiError( 400, "Failed to upload Cover");
    }

    console.log("Creating video")
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

    let videoDoc;
    try {
         videoDoc = await Video.create(videoData);

        if(!videoDoc){
            throw new ApiError(500, "Failed to create video");
        }
        return res.status(200).json({
            success: true,
            message: "Video uploaded successfully",
            video: videoDoc
        })


    } catch (error) {
        
        console.log("Error creating video", error);
        if(videoDoc){
            await Video.findByIdAndDelete(videoDoc._id)
        }
        if(video){
            await deleteFromCloudinary(video.public_id)
        }
        if(thumbnail){
            await deleteFromCloudinary(thumbnail.public_id)
        }
        console.log(error)
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

    let video;

    try {
        video = await Video.findByIdAndUpdate(
                req.video._id,
                {
                    $set: {
                        title,
                        description
                    }
                },
                {new: true}
            ).select("-password")
        
    } catch (error) {
        console.log(error)
    }
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