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



## Mongo DB aggregation pipeline

`npm i mongoose-aggregate-paginate-v2`

The `MongoDB Aggregation ` is a powerful data processing framework that allows for complex data transformations and analysis within the database. It works by passing documents through a series of stages, where each stage performs a specific operation on the data before passing it to the next stage.

### Key Concepts:
Stage-Based Processing: Each stage modifies the data, similar to a conveyor belt.

Optimized Execution: Aggregation operations are more efficient than multiple queries.

Analytics & Reporting: Useful for filtering, grouping, and transforming large datasets.

### Common Stages:
- $match → Filters documents based on conditions.
- $group → Groups documents by a specified key.
- $sort → Sorts the data in ascending or descending order.
- $project → Reshapes documents by selecting or modifying fields.
- $lookup → Performs joins with other collections.
- $unwind → Breaks arrays into separate documents for deeper analysis.

The Aggregation Pipeline is widely used for data analytics, reporting, and efficient querying in MongoDB. 

```js
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
videoSchema.plugin(mongooseAggregatePaginate);
```

### What is Aggregation in MongoDB?
Aggregation is a process in MongoDB that allows you to perform `complex data transformations and computations` using a sequence of stages (like `filtering, grouping, and sorting`) within an `aggregation pipeline`. It is used for analytics, reporting, and processing large datasets efficiently.

### What is Pagination?
Pagination is a technique used to split large datasets into `smaller chunks (pages)` instead of returning all records at once. It helps improve performance and user experience by loading only a `limited number of records per request.`

### What is Aggregation Pagination?
Aggregation pagination combines both concepts—it applies pagination to MongoDB aggregation queries, ensuring that `only a subset of the processed data is returned per request`. This prevents excessive memory usage and speeds up querying large datasets.

### What does mongoose-aggregate-paginate-v2 do?
This plugin adds automatic pagination support to aggregation queries in Mongoose.


###  What does thiis mean
added that to `videos` and `comments` models

### Since you added mongoose-aggregate-paginate-v2 to your Videos and Comments models, it means:

1. Pagination for Aggregation Queries:

- You can now fetch videos and comments in pages instead of retrieving all at once.

- This improves performance and prevents overloading the database with large queries.

2. Efficient Querying & Metadata:

- Instead of manually handling pagination (skip & limit), the plugin automates it.

- You get additional metadata like total pages, current page, and total results.

3. Useful for Large Datasets:

- If your app has many videos and comments, users can load them page by page smoothly.

- Ideal for implementing infinite scrolling or "Load More" buttons.

Now, when you query videos or comments using aggregation, you can use .`aggregatePaginate()` to get paginated results efficiently. 🚀


# Middlewares for models:
In Mongoose, model middlewares (or hooks) allow you to run functions before or after certain operations (like save, remove, updateOne).

🔹 Types of Model Middleware:

1️⃣ Pre Middleware (pre) → Runs before an action (e.g., hashing a password before saving).

2️⃣ Post Middleware (post) → Runs after an action (e.g., logging after deleting a user).

🔹 Example:
```js
userSchema.pre("save", function (next) {
  this.username = this.username.toLowerCase(); // Ensure lowercase usernames
  next();
});

userSchema.post("remove", function (doc) {
  console.log(`User ${doc.username} was deleted`);
});
```
 ### Common Uses:
- Hashing passwords before saving.
- Automatically updating timestamps.
- Logging actions.
- Preventing deletion of important data.