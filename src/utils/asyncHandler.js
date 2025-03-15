//This is a higher order function where we are returning a function

/**
 * A higher order function that wraps a normal request handler function
 * and returns a new function that handles any promise rejections
 * and calls the next function in the middleware chain with the error
 * instead of crashing the server
 */
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

// this can be done instead of try and catch
export {asyncHandler}