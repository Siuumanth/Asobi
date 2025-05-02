import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of our custom ApiError
  if (!(error instanceof ApiError)) {
    const statusCode =
      err.statusCode || (err instanceof mongoose.Error ? 400 : 500);
    const message = err.message || "Something went wrong";
    const errors = err.errors || [];

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode || 500).json(response);
};

export { errorHandler };
