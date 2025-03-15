Lets create Asobi - an entertainment platform inspired by Youtube

### 1. Build backend project structure and 
 ### npm i --save-dev nodemon prettier

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  ```

### 2. CORS - tells who should talk to ur db, its a middleware that comes in between ou requsts

```js

//using middlewars to make our requests more secure
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

//common middlewares
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true,limit : "16kb"}))
app.use(express.static("public"))
//this means static images is in public folder
```


### 3. Added middlewars, set up atlas mongodb db, set up urls in connectDB, and did app.listen in index.js after that
```js
   const connectDB = async () => 
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: process.env.DB_NAME,
            serverSelectionTimeoutMS: 8000, // Wait 5 seconds before failing
        });
```
-
-
-

# Here, we will create helper functions in utils folder beforehand to make our development easy

### 1. Create async controllers template beforehand so we can reuse it always, Higher order functions.

```js
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}
```

#### This code will expand like this BTS
```js
app.get('/data', (req, res, next) => {
    Promise.resolve(
        (async (req, res) => {
            const data = await someAsyncFunction();
            res.json(data);
        })(req, res, next) // Calling the async function with (req, res, next)
    ).catch(err => next(err)); // Catching errors
});

```

This code defines a higher-order function called asyncHandler. A higher-order function is a function that either takes another function as an argument or returns a function.

## Purpose:
asyncHandler is used to handle errors in asynchronous request handlers in an Express.js application. It ensures that if an asynchronous function (which returns a Promise) throws an error, the error is passed to Express’s error-handling middleware instead of crashing the server.


In Express.js, middleware is a function that runs between the request and response, modifying the request, response, or passing control to the next function in the chain.

```js
const asyncHandler = (requestHandler) => 
```
The function asyncHandler takes another function (requestHandler) as an argument.
requestHandler is expected to be an asynchronous function that handles requests in Express.

```js
return (req, res, next) => {
```
The function asyncHandler returns a new function that takes the usual Express middleware parameters:
- req → The request object.
- res → The response object.
- next → A function to pass control to the next middleware (including error handlers).

3. Handling the Asynchronous Function
```js
Promise.resolve(requestHandler(req, res, next))
  .catch((err) => next(err));
```
- `requestHandler(req, res, next)` is executed.
- Since requestHandler is an async function, it returns a Promise.
- `Promise.resolve(...).catch((err) => next(err))` does two things:
- If requestHandler succeeds → The request is handled normally.
- If requestHandler throws an error (rejects the Promise) → The error is passed to `next(err)`, which calls Express’s error-handling middleware instead of crashing the app.  `its proper error handling`


### Summary of the Structure
- asyncHandler takes a function `(requestHandler).`
- It returns another function `((req, res, next) => { ... })` that matches Express middleware structure.
- That returned function calls `requestHandler(req, res, next)` inside `Promise.resolve().`
- If requestHandler fails, .catch(next) ensures the error is passed to Express.


### 2. Api response
```js
class ApiResponse{
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message  
        this.success = statusCode < 400 //boolean value
    }
}

export {ApiResponse}
```

### ApiError


```js
class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""){
            //setting initial values
            super(message);
            this.statusCode = statusCode;
            this.errors = errors;
            this.message = message
            this.success = false;
            this.data = null

            if(stack) {
                this.stack = stack;
            } else{
                Error.captureStackTrace(this, this.constructor);
            }
        
    }
}
```

In JavaScript, the call stack is a data structure that keeps track of function calls in the order they need to be executed. When a function is called, it is pushed onto the stack, and when it returns, it is popped off. If a function calls another function, the new function is placed on top of the stack, and execution moves to it. Errors, especially in deeply nested calls or infinite recursions, generate a stack trace, which is a snapshot of the function calls leading up to the error. 

In the `ApiError` class, `this.stack` helps in debugging by showing where the error originated. If a custom stack is provided, it is used; otherwise, `Error.captureStackTrace(this, this.constructor)` generates one automatically, ensuring the error’s origin is logged for better debugging.

- 
- 
- 

## Adding healthcheck routes and testing, useful while deploying 

### 1. Health Check Route (`hlthchk.routes.js`)
```js
import { Router } from "express";
import { healthcheck } from "../controllers/hlthchk.ctr.js";

const router = Router();

// Health check route when `/` is accessed
router.route("/").get(healthcheck);

export default router;
```
This file sets up a route for checking server health.
Router from Express is used to create a modular route.
The healthcheck function from the controller is mapped to the GET / route. 

### 2. Creating Health Check controller
`hlthchk.ctr.js`

```js
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, "OK", "Health Check passed")); 
});

export { healthcheck };
```

#### Explanation:
- Handles health check logic and returns a response when called.
- Uses asyncHandler to automatically handle errors instead of using try-catch blocks.
- Sends a JSON response using ApiResponse, ensuring a consistent API response format.
The response structure is:
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": "Health Check passed"
}
```
Exports the healthcheck function so it can be used in the route.


### 3. Registering the Health Check Route ( app.js)

```js
import healthcheckRouter from "./routes/hlthchk.routes.js";

// Mounting the route
app.use("/api/v1/healthcheck", healthcheckRouter);
```
- Imports the health check router from hlthchk.routes.js.
- Mounts it at /api/v1/healthcheck, meaning any request to this URL will be handled by healthcheckRouter.
- The app.use() function registers the router, making the endpoint accessible.