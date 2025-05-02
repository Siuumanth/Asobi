# User registeration
For user registration controller, we will be using the `asyncHandler`

```javascript
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

// this can be done instead of try and catch
export {asyncHandler}
```

The `asyncHandler` is a higher-order function used in Express.js to simplify error handling for asynchronous route handlers. Instead of wrapping each async function in a `try...catch` block, you pass the function to `asyncHandler`, which automatically catches any errors and forwards them to Express's error-handling middleware using `next(err)`. This keeps your code cleaner and ensures the server doesn't crash due to unhandled promise rejections.'''

Also,
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next(); // pass to next route or middleware
});

```
### What is `app.use()`?
`app.use()` is a method in Express that:
1. **Registers middleware functions**.
2. Can be used to define **global behavior** for all requests or for specific path patterns.
3. Works for **all HTTP methods** (GET, POST, etc.), unless limited by the path or logic inside the middleware.

---

## Making the user registration middleware:

User route:
```javascript
import {Router} from "express";
import {registerUser} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.mw.js';
const router = Router();

//means when a POST request is made to /register, run the registerUser function.
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
);
export default router
```

### 🧩 Step-by-step explanation:

##### ✅ `upload.fields(...)`

This is a **middleware function** from `multer` (or any other file upload library you're using), telling Express:

> “Before running `registerUser`, handle file uploads for these two fields:”
- `avatar`: only allow 1 file
- `coverimage`: only allow 1 file

So if a user submits a form with:
- `avatar: file.jpg`
- `coverimage: banner.png`

Those files will be:
- Parsed
- Stored (to disk or memory depending on how `upload` is configured)
- Available in `req.files`

---
#### ✅ `registerUser`
After file upload middleware runs, the control goes to your `registerUser` function, where you can now access:

`req.files.avatar[0] , req.files.coverimage[0]`

And also regular form data via `req.body`.

---

## Actual User Registeration Function

**User Registration Controller - `registerUser` Flow Explained**

---
### Overview
This controller handles **new user registration**. It includes validations, Cloudinary upload, and saving the user to MongoDB.

---
```javascript
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
  
// Actual business logic for uplaoding
const registerUser = asyncHandler( async (req,res) => {
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
    const avatarLocalPath = req.files?.avatar[0]?.path  // getting path from the route
    const coverLocalPath = req.files?.cover[0]?.path
    if (!avatarLocalPath){
        throw new ApiError( 400, "Avatar file is missing")
    }
    // uploading on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage = "";
    if(coverLocalPath){
         coverImage = await uploadOnCloudinary(coverLocalPath)
    }
    // creating a new user
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
})

export {
    registerUser
}
```
### 📦 Imports Used
- **asyncHandler**: Wraps the async controller to handle errors.
- **ApiError**: Custom error class for throwing controlled errors.
- **User**: Mongoose model used to interact with the `users` collection.
- **uploadOnCloudinary**: Utility to upload images.
- **ApiResponse**: Custom response formatter.

---

### 🔁 Full Flow Breakdown

#### 1. **Extract user input from request**

```js
const { fullName, email, username, password } = req.body;
```

> These are required fields for user registration.

#### 2. **Input validation**

```js
if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
  throw new ApiError(400, "All fields are required");
}
```

> Checks for empty fields using `.trim()`. Ensures nothing is blank.

#### 3. **Check if user already exists**

```js
const existedUser = await User.findOne({
  $or: [{ username }, { email }],
})
```

> Prevents duplicate registration with existing username or email.

#### 4. **Extract image paths from `req.files`**

```js
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverLocalPath = req.files?.cover[0]?.path;
```

> These come from Multer. Avatar is required; cover is optional.

#### 5. **Throw error if avatar is missing**

```js
if (!avatarLocalPath) {
  throw new ApiError(400, "Avatar file is missing")
}
```

#### 6. **Upload images to Cloudinary**

```js
const avatar = await uploadOnCloudinary(avatarLocalPath);
let coverImage = "";
if (coverLocalPath) {
  coverImage = await uploadOnCloudinary(coverLocalPath);
}
```

> Uses utility function to upload and returns a URL.

#### 7. **Create the user in DB**

```js
const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password, // Will be hashed via Mongoose pre-hook
  username: username.toLowerCase(),
})
```

> All fields are saved. Password hashing happens in the `User` model pre-save hook.

#### 8. **Fetch and sanitize user**

```js
const createdUser = await User.findById(user._id).select("-password -refreshToken");
```

> Retrieves the new user without sensitive fields.

#### 9. **Final error check**

```js
if (!createdUser) {
  throw new ApiError(500, "Something went wrong while registering a user")
}
```

#### 10. **Send response**

```js
return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"))
```

> Returns success response with sanitized user info.

---

### 💡 Notes

- **Password encryption** is handled in the `user.models.js` file using `pre('save')` hook.
    
- **Error handling** is managed globally using the custom `ApiError` and `asyncHandler`.
    
- **Cloudinary** stores and returns the image URLs.
    
- **Modular structure** helps keep each concern (e.g., validation, DB, upload) clean and testable.
    

---

### 🔄 Request Flow Summary

```
POST /api/v1/users/register
  ├─ Middleware (upload)
  ├─ Controller (registerUser)
      ├─ Validate input
      ├─ Check duplicates
      ├─ Upload avatar & cover to Cloudinary
      ├─ Create user (password gets encrypted)
      ├─ Fetch user (excluding password, token)
      └─ Send JSON response
```

---

This setup ensures secure, validated, and scalable user registration.:


---



