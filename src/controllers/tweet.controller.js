import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// Unsecured
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const username = req.params.username;
    if(!username){
        throw new ApiError(400, "Username is required")
    }

    const user = await User.findOne({username});
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.find({
        owner: user._id
    })

    if(!tweets || tweets.length === 0){
        throw new ApiError(404, "Tweets not found")
    }

    return res.status(200).json(new ApiResponse(
        200,
        tweets,
        "Tweets fetched successfully",
        "success"
    ))
})

// secured
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Content is required")
    }

    // verifying user exists
    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const tweetData = {
        owner: userId,
        content,
    }

    const tweet = await Tweet.create(tweetData);

    return res.status(200).json(new ApiResponse(
        200,
        tweet,
        "Tweet created successfully",
        "success"
    ))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const tweetId = req.params.tweetId;
    const userId = req.user?._id;

    if(!userId){
        throw new ApiError(400, "User not found")
    }
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet id not provided")
    }

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner : userId
    })

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    return res.status(200).json({
        success: true,
        message: "Tweet deleted successfully",
        data: tweet,
        code: 200,
        status: "success",
    })
})

export {
    createTweet,
    getUserTweets,
    deleteTweet
}