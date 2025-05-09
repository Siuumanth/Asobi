import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// secured
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if the subscription exists
    const sub = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    let subscription;
    if (!sub) {
        // Create a new subscription if it doesn't exist
        subscription = await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });
    } else {
        // Delete the existing subscription if it exists
        const deleteResult = await Subscription.deleteOne({
            subscriber: userId,
            channel: channelId,
        });
        
        // If nothing was deleted, return an error
        if (deleteResult.deletedCount === 0) {
            throw new ApiError(400, "Subscription not found or already removed");
        }
        
        subscription = deleteResult;
    }

    return res.status(200).json(new ApiResponse(
        true,  // Success flag
        subscription,  // Return the subscription object (created or deleted result)
        sub ? "Subscription removed successfully" : "Subscription added successfully"
    ));
});



// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId),
            },  
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberInfo",
            }
        }
        ,
        {
            $project: {
                subscriberInfo: 1,
                // this means only include tis in the final ans, nothing else
            }
        }
    ])

    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "Subscribers not found");
    }

    return res.status(200).json(new ApiResponse(
        true,
        subscribers,
        "Subscribers fetched successfully"
    ));
});




// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }

    // Convert subscriberId to ObjectId
    const subId = mongoose.Types.ObjectId(subscriberId);

    const userId = req.user?._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const subs = await Subscription.aggregate([
        {
            $match: {
                subscriber: subId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo",   
            }
        }
    ])

    if (!subs) {
        throw new ApiError(404, "Subscriptions not found");
    }

    return res.status(200).json(new ApiResponse(
        true,  // Success flag
        subs,  // Return the subscription object (created or deleted result)
        "Subscriptions fetched successfully"
    ));
})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}