import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

// Actual business logic for uplaoding 

const registerUser = asyncHandler( async (req,res) => { 
    console.log("starting registration\n", req.body)
    console.log("FILES", req.files);

    //Registeration logic
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


export {
    registerUser
}

