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

