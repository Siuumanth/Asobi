import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
// auth.middleware.js

// Middleware to verify JWT token and attach user to request
// This function attaches user info to the request object
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // 1. Extract token from cookie or Authorization header
    console.log("Starting verification")
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // 2. If token doesn't exist, user is unauthorized
    if (!token) {
        throw new ApiError(401, "Unauthorized - No token provided");
    }

    try {
        // 3. Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       console.log("jwt is decoded  ", decoded)

        // 4. Find the user in the database
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
    console.log("User is ter")
        
        if (!user) {
            console.log("User isss not found")
            throw new ApiError(401, "Unauthorized - User not found");
        }

        // 5. Attach user to the request object for later use
        req.user = user;
        console.log("User is attached")
        // 6. Continue to the next middleware/route
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});
