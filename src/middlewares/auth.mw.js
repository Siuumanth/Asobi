import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

// auth.middleware.js
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

// Middleware to verify JWT token and attach user to request
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // 1. Extract token from cookie or Authorization header
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // 2. If token doesn't exist, user is unauthorized
    if (!token) {
        throw new ApiError(401, "Unauthorized - No token provided");
    }

    try {
        // 3. Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 4. Find the user in the database
        const user = await User.findById(decoded?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Unauthorized - User not found");
        }

        // 5. Attach user to the request object for later use
        req.user = user;

        // 6. Continue to the next middleware/route
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});
