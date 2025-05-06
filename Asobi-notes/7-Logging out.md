## JWT Authentication Middleware Explained

![[Pasted image 20250506204110.png]]

### Introduction:

The **verifyJWT** middleware ensures that users accessing protected routes are authenticated using JWT tokens. It verifies if the incoming request contains a valid JWT and attaches the corresponding user data to the request. If the token is missing or invalid, the middleware denies access.

```javascript
// auth.middleware.js
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

// Middleware to verify JWT token and attach user to request
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // 1. Extract token from cookie or Authorization header
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // 2. If token doesn't exist, user is unauthorized, and denies access 
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

```

### Explanation:

1. **Extracting the Token:**  
    The token is first extracted from either the cookie (`req.cookies.accessToken`) or from the Authorization header (`req.header("Authorization")`). The Bearer prefix is removed if present.
    
2. **Missing Token Check:**  
    If the token is missing, an error is thrown, and the user is blocked from accessing the protected route.
    
3. **Token Verification:**  
    The JWT is verified using the `jwt.verify()` method, using the secret stored in the environment variable (`process.env.ACCESS_TOKEN_SECRET`). If the token is invalid or expired, an error is thrown.
    
4. **User Lookup:**  
    Once the token is verified, the user ID (`_id`) is extracted from the token's payload, and a database query is made to retrieve the user. If no user is found, an error is thrown.
    
5. **Attaching the User to `req`:**  
    If the user is found, their details are attached to the `req.user` object so that subsequent middleware or route handlers can access the user's information.
    
6. **Proceed to Next Middleware:**  
    If all checks pass, the `next()` function is called, which moves the request to the next middleware or route handler.
    

---

This middleware serves as an essential security layer, ensuring that only authenticated users can access protected routes.

You're right that when a **logout** request is sent, the **user ID** typically isn't directly included in the request body, so how does the server know **which user** is logging out? This is where **middleware** (like the `verifyJWT` middleware) comes in handy for **logouts as well**.

### Why Do We Need User Info for Logout?

1. **Session or Token Invalidation**:
    - If your system relies on server-side sessions or any kind of token validation beyond just the client, you need the **user ID** to perform the action of invalidating the session or logging them out properly.
        
2. **Refresh Tokens**:
    - If you're storing the **refresh token** server-side, when the user logs out, you'd want to delete or invalidate that refresh token, and to do that, you need the **user's identity** (i.e., their ID) to identify and clear the refresh token from the database.
        
---

### How Does the `verifyJWT` Middleware Help in Logout?

When a user sends a **logout request**:

- They would **still need to provide their access token** (usually in a cookie or Authorization header).
    
- The middleware (`verifyJWT`) can **extract and verify the token**, decode it, and attach the **user ID** (and other user details) to `req.user`.

For example:

- The **access token** contains the **user's ID** in its payload (as part of the JWT).
- The **middleware** will decode the token, find the user by their **ID** (`req.user = user`) and attach the user info to the request.
    
- Once the user is identified, the server can:
    
    1. Remove the user's **refresh token** from the database (if you store it server-side).
    2. Clear the **access and refresh tokens** from the client-side cookies.
        
So, the middleware is helping **verify the identity of the user** even when the request doesn’t explicitly send a user ID. Without it, you'd either have to:

- Require the client to **send the user ID in the request** (which could be insecure).
- **Manually query** the database for the user, which is more complex and error-prone.
    
---

### **Simplified Flow for Logout:**

1. **User Sends a Logout Request**: The request will contain an **access token** (usually in the cookies or headers).
    
2. **Middleware Verifies Token**: The `verifyJWT` middleware checks if the access token is valid and decodes it to attach the **user's ID** to the request.
    
3. **Server Invalidates the User Session**:
    
    - With the **user ID** now available in `req.user`, the server can invalidate the refresh token (if stored server-side).
        
    - The server can clear the **access token** and **refresh token** from the **client’s cookies** or session.
        
4. **Response**: Once the tokens are cleared and the session is invalidated, the server responds with a success message, and the user is effectively logged out.
    

### TL;DR:

Yes, when logging out, you **need the user ID** to identify the user, and you can get this from the JWT, which the `verifyJWT` middleware decodes and attaches to the `req.user` object. The middleware helps because the logout request itself might not contain the user ID directly, but it will contain the token, which the middleware can verify and use to extract the ID.

---


# Logging out:

```javascript
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
```

 Then, we will need to inject the middleware in the appropriate route, so we go to `user.routes.js`, and add this code

```javascript

//secured route
// adding middleware and logoutUser is the next() function
router.route("/logout").post(verifyJWT, logoutUser);

//router.route("/logout").post(verifyJWT,/*Any function can be added here*/ logoutUser);
// this is how u inject middlewares

export default router
```