import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

// Method to generate access token, after the user logs in
const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userid)
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
    const {username, password} = req.body;

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

    // verifying password
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }
    
    // saving refresh token
    const {accessToken, refreshToken} = await generateAccessToken(user._id)

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


// Actual business logic for uplaoding 
const registerUser = asyncHandler( async (req,res) => { 
    console.log("starting registration\n", req.body)
    console.log("FILES", req.files);

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



    // uploading on cloudinary
    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // let coverImage = "";
    // if(coverLocalPath){
    //      coverImage = await uploadOnCloudinary(coverLocalPath)
    // }
  
    console.log("starting uploading")
    let avatar;
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Avatar uploaded successfully", avatar)
    }catch(err){
        console.log("Error uploading avatar", err);
        throw new ApiError( 400, "Failed to upload avatar");
    }

    let coverImage;
    try{
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Cover uploaded successfully", avatar)
    }catch(err){
        console.log("Error uploading Cover", err);
        throw new ApiError( 400, "Failed to upload Cover");
    }


    console.log("Now creating new user in atlas ")
    // creating a new user
    try {
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
    
        //verifying if the user was created or not
        // This gives us the actual user object from database
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
        // select will exclude password and refresh token for us 
    
        // if no user created
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering a user")
        }
    
    
        //returning final result
        return res
          .status(201)
          .json( new ApiResponse(200, createdUser, " User registered successgfully"))
    } catch (error) {
        console.log(" User creation failed")
        // Deleting in case smtg fails
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "Something went wrong, images removed")

    }
})


// Method for generating new access token 
const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;     // grabbing refresh token

    if(!incomingRefreshToken){ 
        throw new ApiError(401, " Refresh token is required")
    }

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
            throw new ApiError(401, "Invalid refresh token")
        }

        // checking if user is valid
        if(incomingRefreshToken != user?.refreshToken){
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
        throw new ApiError(500, "Something went wrong")
    }

})


// Logging out user, just clearing cookies and deleting refresh token
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        // TODO: need to come back here after middleware
        // Now , using middleware, the user object is always available and attached to req, so we will use that to get user Id and clear it from our DB
        
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {new: true}
    )
        
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



export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
}

