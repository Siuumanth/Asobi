# Writing models in mongoDB
## what are models?

In backend development, a model represents the structure of data in your application. It defines how data is stored, processed, and retrieved, often mapping to a database table or collection. Models are used in frameworks like Django (Python), Express.js (Node.js), and Laravel (PHP) to interact with databases using Object-Relational Mapping (ORM) or Object-Document Mapping (ODM).

In MongoDB, which is a NoSQL document database, models define the structure of documents stored in collections. Instead of tables and rows (like SQL databases), MongoDB uses collections and documents. In Mongoose (a popular ODM for MongoDB in Node.js), models are defined using schemas, which specify the structure, data types, and validation rules for documents in a collection.


### eg - creating user model schema in mongodb

```js

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
  
```

## Video model:

```js
/*

videos [icon: video] {
  id string pk
  owner objectId users
  file string
  thumbnail string
  title string
  description string
  duration number
  views number
  isPublished boolean
  createdAt Date
  updatedAt Date
}

*/

import mongoose, {Schema} from mongoose;


const videoSchema = new Schema({
  videoFile: {
    type: String,  //cloudinary url
    required: true,
  },
  thumbnail: {
    type: String,  //cloudinary url
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  owner: {
    type : Schema.Types.ObjectId,
    ref: "User",
  },
},
{timestamps: true}
)
  

export const Video = mongoose.model("Video", videoSchema);
```

like that, we added comments, playlist, likes, subscriptions with proper references