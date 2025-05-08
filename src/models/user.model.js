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


import bcrypt from "bcrypt"
import mongoose, { Schema } from "mongoose";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();



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
        default: "",
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
  


// Now we will encrypt password before storing it

// pre hooks, next is for passing one middleware to another
// its like a ripple effect between middlewares
userSchema.pre("save", async function (next) {

   // This makes sure the password is only hashed if it was modified or newly set 
  if(!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 10)

  next()
})

// we have set for signup, now for login
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//setting up JSON web token for access
userSchema.methods.generateAccessToken = function () {
  // short lived access token
  // this is the payload
  return jsonwebtoken.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  })
};


userSchema.methods.generateRefreshToken = function () {
  // short lived access token
  // this is the payload
  return jsonwebtoken.sign({
    _id: this._id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  })
};


  
export const User = mongoose.model("User", userSchema);
  