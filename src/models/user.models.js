/*
users [icon: user] {
    id string pk
    username string
    email string
    fullName string
    avatar string
    coverImage string
    watchHistory objectId[] videos
    password string
    refreshToken string
    createdAt Date
    updatedAt Date
  }
  */

import mongoose, { Schema } from "mongoose";

// defining the whole model
  const userSchema = new Schema(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
      },
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      avatar: {
        type: String, // Cloudinary URL
        required: true,
      },
      coverImage: {
        type: String, // Cloudinary URL
        required: true,
      },
      watchHistory: [
        {
          type: Schema.Types.ObjectId,
          ref: "Video", // References Video collection
        },
      ],
      password: {
        type: String,
        required: [true, "Password is required"], // Custom error message
      },
      refreshToken: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    { timestamps: true } // Automatically handles createdAt & updatedAt
  );
  
  export const User = mongoose.model("User", userSchema);
  