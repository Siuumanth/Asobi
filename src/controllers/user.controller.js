import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.model.js";
import { ObjectId } from 'mongodb';


// Method to generate access token, after the user logs in
const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        // check for user existance
        if(!user){
            console.log("Couldnt find user")
            throw new ApiError(400, "User not found");
        }
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        await user.save({validateBeforeSave:false})
    
        return {accessToken, refreshToken};
    
        // before returning, we will be storing refreshtoken in the object
    } catch (error) {
        throw new ApiError(400, "Somethong went wrong when generating access tokens ");
    }
}


const loginUser = asyncHandler( async (req,res) => {
    // get data from body
    console.log(req.body)
    const {username, password, email} = req.body;


    console.log("User trying to log in ")
    //validation
    if(!email){
        throw new ApiError(400, "email is required")
    }
    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }
console.log("User exists")
    // verifying password
    const isPasswordCorrect = await user.isPasswordMatched(password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials")
    }
    
    // saving refresh token
    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)

    // Now we have to login the user, so for that, we will re get the user object from databsae, with the saved info


    // login means saving user data in the browser session
    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

    if(!loggedInUser){
        throw new ApiError(500, "User not found")
    }

    const options = {
        httpOnly: true,   // user camt modify
        secure: process.env.NODE_ENV === "production",
    }


    // finally sending response to user
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200, 
        {
            user: loggedInUser, accessToken, refreshToken
        },  // for mobiles
        "User logged in successfully  //"
    ))
})


// Actual business logic for registering 
const registerUser = asyncHandler( async (req,res) => { 
    console.log("starting registration\n", req.body)
    console.log("FILES");

    //Registeration logic , form data
    const {fullName, email, username, password} = req.body;

    //minor validation
    if(
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    
    const existedUser = await User.findOne({
        $or: [{username}, {email}] // Search a user based on username or email
    })
    if(existedUser){
        throw new ApiError(409, "Username or email already exists");
    }

    // Handling images
    const avatarLocalPath = req.files?.avatar[0]?.path  
    // getting path from the route
    const coverLocalPath = req.files?.coverImage[0]?.path


    if (!avatarLocalPath){
        throw new ApiError( 400, "Avatar file is missing")
    }

    console.log("starting uploading")
    let avatar;
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Avatar uploaded successfully")
    }catch(err){
        console.log("Error uploading avatar", err);
        throw new ApiError( 400, "Failed to upload avatar");
    }

    let coverImage;
    try{
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Cover uploaded successfully")
    }catch(err){
        console.log("Error uploading Cover", err);
        throw new ApiError( 400, "Failed to upload Cover");
    }


    console.log("Now creating new user in atlas ")
    // creating a new user
    let user;
    try {
        user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),
        })
        console.log("User saved")
    
        //verifying if the user was created or not
        // This gives us the actual user object from database
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        console.log("User confirmed")
        // select will exclude password and refresh token for us 
    
        // if no user created
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering a user")
        }
    
        // finally, sending tokens back as cookies
    // 1. Generate JWTs
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);
    
    // Saving new token 
    user.refreshToken = refreshToken;
    const updatedUser =   await user.save({ validateBeforeSave: false });

    if(!updatedUser){
        throw new ApiError(500, "Something went wrong while saving tokens")
    }

    // 2. Define secure cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    
    // 3. Return cookies and user data
    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          {
            user: createdUser,
            accessToken,
            refreshToken,
          },
          "User registered successfully"
        )
      );
    } catch (error) {
        console.log(" User creation failed and error caught")
        // Deleting in case smtg fails

        // deleting user
        const deletedUser = await User.findByIdAndDelete(user._id)
        if(deletedUser){
            console.log("User deleted")
        }
        // deleting images
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "Something went wrong, images removed and user deleted" + error)

    }
})


// Method for generating new access token 
const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;     // grabbing refresh token

    if(!incomingRefreshToken){ 
        throw new ApiError(401, " Refresh token is required")
    }
    console.log("Trying to refresh token")

    // IN generating token codes:
    // For refresh, we only sign the User id from our database
    // For access token, we sign the id, name,username,email
    // so we can take advantage of this

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
         
        if ( !user){
            throw new ApiError(401, "USer no exists")
        }

        // checking if user is valid
        if(incomingRefreshToken != user.refreshToken){
            throw new ApiError(401, "Invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV ==="production",
        }

        const {accessToken, refreshToken: newRefreshToken } = await generateAccessandRefreshToken(user._id)
        
        return res
           .status(200)
           .cookie( "accessToken", accessToken, options)
           .cookie("refreshToken", newRefreshToken, options)
           .json(
              new ApiResponse(
                200, {
                    accessToken,
                     refreshToken: newRefreshToken
                    }, 
                    "Access token refreshed successfully"
                )
            )

    } catch (error) {
        throw new ApiError(500, "Something went wrong", error)
    }

})


// Logging out user, just clearing cookies and deleting refresh token
const logoutUser = asyncHandler(async (req, res) => {
    // TODO: need to come back here after middleware
    // Now , using middleware, the user object is always available and attached to req, so we will use that to get user Id and clear it from our DB
        
    const updatedDoc = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            }
        },
        {new: true} //This is a Mongoose-specific option that means: “Return the updated document instead of the old one.”
    )
    console.log(updatedDoc)
    if(!updatedDoc){
        throw new ApiError(500, "Something went wrong while logging out")
    }
        
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV ==="production",
    }

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Logged out successfully"))
})

// CRUD APIs
// Changing currrent password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    // due to middleware, user details will already be there

    const user = await User.findById( 
        req.user?._id,
    );

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    //wrong password
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }
    
    user.password = newPassword;   // encryption is automatic 
    await user.save({validateBeforeSave: false}) // this will encrypt password again

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
})

// Getting current user
const getCurrentUser = asyncHandler(async (req, res) => {
    // details is already present in the middleware , we will just return it
    return res.status(200).json(new ApiResponse(200, req.user, "Current user details"))
})

// update name and email
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;
    
    if(!fullName || !email){
        throw new ApiError(400, "Full name and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})

//update Avatar
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    
    //checking cloudinary URL
    if(!avatar.url){
        throw new ApiError(500, "Something went wrong while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, avatar, "Avatar updated successfully")) 
})

//update Cover Image
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.files?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    //checking cloudinary URL
    if(!coverImage.url){
        throw new ApiError(500, "Something went wrong while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, coverImage, "Cover image updated successfully")) 
})



// Aggregation functions
// mainly used for getting larged amount of specific data at once




const getChannel = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { username } = req.query;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    // Step 1: Fetch channel data + videos + subscriber count
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $addFields: {
                videosCount: { $size: "$videos" },
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                email: 1,
                coverImage: 1,
                videos: 1,
                videosCount: 1,
                subscriberCount: 1
            }
        }
    ]);

    if (!channel || channel.length === 0) {
        throw new ApiError(404, "Channel not found");
    }

    const channelData = channel[0];

    // Step 2: If logged in, check if user is subscribed
    let isSubscribed = false;
    if (userId) {
        isSubscribed = await Subscription.exists({
            channel: channelData._id,
            subscriber: userId
        });
    }

    // Step 3: Respond with data
    res.status(200).json(new ApiResponse(
        200,
        {
            ...channelData,
            isSubscribed: Boolean(isSubscribed)
        },
        "Channel profile fetched successfully"
    ));
});

  
// Lookup joins document with the from collection

const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)  // Syntax for getting object ID from string
            },
        },
        {
            // getting videos from watch history IDs
            $lookup: {
                from: "videos",
                localField: "watchHistory",  // list of IDs
                foreignField: "_id",
                as: "watchHistory",

                // Pipe line inside pipeline, to filter out our documents more
                // Finding video details along with video

                // We are passing the data from previous pipeline, which is from videos collection to this pipeline, to get video details
                pipeline: [
                    {
                        // getting owner details 
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {  // project means to keep only these fields
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"  // gives first element
                            }
                            // Whenever we lookup,  Mongo always returns an array of documents, we are just picking the first one
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200, 
        user[0], 
        "Watch history fetched successfully"
    ))
})



export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannel,
    getWatchHistory
}


// Decommissioned API
const getUserChannelProfile = asyncHandler( async (req, res) => {

    // query parameter will be username
    const {username} = req.query

    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }
    
    // aggregation pipeline to get subscriber list of the channel
    const channel = await User.aggregate(
        [
            {
                $match :{
                    username: username?.toLowerCase()  // 1
                }
            },
            {
                // Videos list
                $lookup:{                              // 2
                    from: "videos",
                    localField: "_id",   // field in current table
                    foreignField: "owner",   // field in videos table
                    as: "videos"          
                }
            },

            {
                // Getting list of channels subscribed to
                $lookup: {                               // 3
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"     // gets all channels i have subbed to
                }
            },
            {
// Lookup to check if the logged-in user is subscribed to this channel
                $lookup: {
                  from: "subscriptions",  // Check in the 'subscriptions' collection
                  let: { channelId: "$_id" },  // Define a variable 'channelId' as the current user's _id (channel being viewed)
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            // Match subscriptions where the 'channel' field equals the current channel's _id
                            { $eq: ["$channel", "$$channelId"] },

                            // And where the 'subscriber' field matches the logged-in user's _id
                            { $eq: ["$subscriber", ObjectId(req.user._id)] }  // convert to object ID before checking
                          ]
                        }
                      }
                    }
                  ],
                  // Resulting array will be stored in this field
                  as: "matchedSubscriber"
                },
            },
            {
                $addFields: {                       // 4
                    videosCount: { $size: "$videos" },   // referring to previous pipe
                    ChannelsSubscribedToCount: { $size: "$subscribedTo" },

                // Add a field 'isSubscribed' that checks if the logged-in user is subscribed
                    isSubscribed: {
                      // If matchedSubscriber has more than 0 items, the user is subscribed
                      $gt: [{ $size: "$matchedSubscriber" }, 0]
                    }
                              
                }
            },
            {
               // Project only the necessary data
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    ChannelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email: 1
                } 
            }
        ]
    )

    // no channel found
    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200).json(new ApiResponse(
        200, 
        channel[0], 
        "Channel profile fetched successfully"
    ))
})