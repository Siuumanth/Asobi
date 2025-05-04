## Access Tokens and Refresh Tokens in ASOBI (YouTube Clone Backend)

### What Does "Logging In" Mean Technically?

In technical terms, **logging in** means:

1. Verifying a user's credentials (typically email/username and password).
    
2. Generating authentication tokens if credentials are correct.
    
3. Storing these tokens (usually in cookies or local storage) on the frontend to maintain user sessions.
    
4. Sending back the user's basic profile (excluding sensitive data like password) to the frontend for use in the UI (e.g., showing username, profile picture, etc).
    

### What are Access and Refresh Tokens?

In modern authentication systems, especially those using JWT (JSON Web Tokens), **access tokens** and **refresh tokens** are crucial for maintaining user sessions securely.

#### Access Token

- A short-lived token (usually expires in minutes) used to authenticate user requests.
    
- Passed in headers (e.g., Authorization: Bearer ) to access protected resources.
    
- Should be lightweight and contain minimal user information (often just a user ID and expiration time).
    

#### Refresh Token

- A long-lived token (expires in days/weeks) used to obtain a new access token without asking the user to log in again.
    
- Stored securely (e.g., in httpOnly cookies or secure storage) and sent only when access tokens expire.
    
- Helps maintain persistent login while still keeping short-lived access tokens secure.
    

### Why Use Both?

- Using a short-lived access token limits the time a stolen token is useful.
    
- The refresh token ensures that the user doesn't need to re-authenticate frequently, improving UX.
    
- Together, they create a balance between security and usability.
    

---

### Handling Token Generation and Login in ASOBI

#### Step 1: Token Generation

```javascript
const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(400, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(400, "Something went wrong when generating access tokens");
    }
};
```

This function fetches the user, generates JWT access and refresh tokens using model methods, saves the refresh token to the database, and returns both tokens.

#### Step 2: User Login

```javascript
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const user = await User.findOne({ username });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    if (!loggedInUser) {
        throw new ApiError(500, "User not found");
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});
```

In this block:

- We fetch the user using username.
    
- We verify the password.
    
- If valid, we generate tokens and re-fetch the user (excluding password and refresh token fields).
    
- Tokens are set in secure, httpOnly cookies.

**httpOnly cookies** are a type of cookie that **cannot be accessed or modified via JavaScript in the browser**. They are set by the server and are automatically sent with every HTTP request to the same domain. The key benefit of `httpOnly` is **security**.

### Key Features:

- **Inaccessible via JavaScript:** Prevents client-side scripts (like `document.cookie`) from reading or altering the cookie.
    
- **Used for sensitive data:** Commonly used to store tokens (like refresh tokens or session IDs), because they are less vulnerable to **XSS (Cross-Site Scripting)** attacks.
    
- **Sent automatically:** These cookies are automatically sent to the server on each request (including AJAX/fetch), so you don’t have to manually attach them in headers.
    
- The user object and tokens are sent back to the frontend for UI use.
    

### Summary

- Logging in involves authentication and setting session tokens.
    
- Access tokens provide short-term access to protected routes.
    
- Refresh tokens enable longer, persistent sessions securely.
    
- Tokens are stored in cookies, and only non-sensitive user data is sent back to the frontend.

---
