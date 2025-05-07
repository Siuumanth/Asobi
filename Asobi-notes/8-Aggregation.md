## 📘 Aggregation Pagination in MongoDB (ASOBI Context)

### ✅ What is Aggregation in MongoDB?

- Aggregation is a powerful feature in MongoDB used to **process and transform documents** in a collection.
    
- It works using **pipelines**—a sequence of data processing stages.
    
- Each stage takes input from the previous one and outputs the result to the next.
    
- Syntax involves the `aggregate()` method and uses operators like `$match`, `$sort`, `$group`, `$project`, etc.
    

### ✅ What is Pagination?

- Pagination is the technique of **splitting large datasets** into smaller, manageable chunks (pages).
    
- It improves **performance and user experience**, especially in large content feeds (e.g., videos on ASOBI).
    

### ✅ Why Use Aggregation Pagination?

- When using aggregation (e.g., joining with `$lookup`, filtering, or reshaping with `$project`), you can’t paginate directly with `find().skip().limit()`.
    
- Aggregation pagination allows **paginated responses over transformed data**.
    
- Essential when your video list on ASOBI is **sorted by views, likes, or filtered by category/tags** using aggregation logic.
    

### ✅ Basic Aggregation Pagination Structure

```js
const page = 1;
const limit = 10;
const skip = (page - 1) * limit;

const videos = await Video.aggregate([
  { $match: { visibility: 'public' } }, // Filter stage
  { $sort: { createdAt: -1 } },          // Sort stage
  { $skip: skip },                       // Skip stage
  { $limit: limit },                     // Limit stage
  { $project: {                          // Optional reshape stage
      title: 1,
      thumbnail: 1,
      views: 1,
      uploadedBy: 1,
      createdAt: 1
  } }
]);
```

### ✅ Injecting the Aggregation Pagination Plugin

- Instead of manually writing skip-limit logic, you can use **plugins** to abstract it.
- One such plugin is [`mongoose-aggregate-paginate-v2`](https://www.npmjs.com/package/mongoose-aggregate-paginate-v2).
- Steps:
    1. Install the plugin:
        
        ```bash
        npm install mongoose-aggregate-paginate-v2
        ```
        
    2. Add the plugin to your schema:
        
        ```js
        const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
        videoSchema.plugin(mongoosePaginate);
        ```
        
    3. Use it in your query:
        
        ```js
        const aggregate = Video.aggregate([
          { $match: { visibility: 'public' } },
          { $sort: { createdAt: -1 } }
        ]);
        
        const options = {
          page: 1,
          limit: 10
        };
        
        const result = await Video.aggregatePaginate(aggregate, options);
        ```
        
- This handles `skip`, `limit`, and even metadata like `totalPages`, `hasNextPage`.

### ✅ Notes for ASOBI Implementation

- Use aggregation pagination when:
    - Fetching **recommended or trending videos**.
    - Implementing **search results with filters** (e.g., tag/category).
    - Displaying **user profiles with uploaded content**.
        
- Combine with `$facet` if you need total count along with paginated results in one query.

---


# Syntax:


## 📘 MongoDB Aggregation Pipeline Syntax (Detailed Overview)

MongoDB’s aggregation framework allows advanced data processing directly within the database. It works by passing documents through multiple **pipeline stages**.

### 🔧 Basic Syntax

```js
collection.aggregate([
  { stage1 },
  { stage2 },
  ...
]);
```

Each stage is an object that starts with a **stage operator** like `$match`, `$group`, etc.

---

### 1. `$match` — Filter Documents (Like `find`)

```js
{ $match: { field: value } }
```

Filters documents to pass only those that match the condition.

```js
{ $match: { status: "active" } }
```

---

### 2. `$project` — Reshape Documents

```js
{ $project: { field1: 1, field2: 0, newField: "$existingField" } }
```

- Include (1) or exclude (0) fields
    
- Rename or compute new fields
    

```js
{ $project: { name: 1, age: 1, fullName: { $concat: ["$first", " ", "$last"] } } }
```

---

### 3. `$group` — Group by Field (Like SQL `GROUP BY`)

```js
{ $group: { _id: "$field", total: { $sum: "$amount" } } }
```

- `_id` is the grouping key
    
- Use accumulators like `$sum`, `$avg`, `$min`, `$max`, `$push`, `$addToSet`
    

Example:

```js
{ $group: { _id: "$category", count: { $sum: 1 } } }
```

---

### 4. `$sort` — Sort Documents

```js
{ $sort: { field: 1 } }  // 1 for ascending, -1 for descending
```

Example:

```js
{ $sort: { createdAt: -1 } }
```

---

### 5. `$skip` and `$limit` — For Pagination

```js
{ $skip: 10 },
{ $limit: 5 }
```

- Skip first 10 documents, then take 5

---

### 6. `$lookup` — Join with Another Collection

```js
{
  $lookup: {
    from: "foreignCollection",
    localField: "fieldInCurrentCollection",
    foreignField: "_id",
    as: "joinedField"
  }
}
```

To add a pipeline inside lookup:

```js
{
  $lookup: {
    from: "videos",
    let: { userId: "$_id" },
    pipeline: [
      { $match: { $expr: { $eq: ["$owner", "$$userId"] } } }
    ],
    as: "userVideos"
  }
}
```

---

### 7. `$unwind` — Deconstruct Array Field

```js
{ $unwind: "$arrayField" }
```

- Turns each element of an array into a separate document

---

### 8. `$addFields` — Add New Fields

```js
{ $addFields: { fullName: { $concat: ["$first", " ", "$last"] } } }
```

- Adds computed or derived fields

---

### 9. `$facet` — Multi-pipeline in One Query

```js
{
  $facet: {
    metadata: [ { $count: "total" } ],
    data: [ { $skip: 0 }, { $limit: 10 } ]
  }
}
```

- Useful for paginated data + total count in one go
    

---

### 🧠 Tips

- Always index fields used in `$match` and `$sort`
- `$project` early can reduce data size and speed up queries
- Use `$facet` for efficient pagination with meta info

---

This structure is fully compatible with Node.js (Mongoose), Java (MongoDB driver), and other supported drivers.

Let me know if you'd like a diagram of this pipeline flow or code snippets for a specific language.

---




# Actual code:

## 📘 Detailed Explanation: User Aggregation in ASOBI

### 🔹 Function: `getUserChannelProfile`

This function fetches a user's channel profile along with subscriber information, using MongoDB's aggregation pipeline.

```js
const getUserChannelProfile = asyncHandler( async (req, res) => {

    // query parameter will be username
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }
    
    // aggregation pipeline to get subscriber list of the channel
    const channel = await User.aggregate(
        [
            {
                $match :{
                    username: username?.toLowerCase()  // Step 1: Match user by username (case-insensitive)
                }
            },
            {
                $lookup:{                              // Step 2: Lookup subscribers
                    from: "subscriptions",             // Target collection
                    localField: "_id",                 // Current user's _id
                    foreignField: "channel",           // Channel field in subscriptions
                    as: "subscribers"                  // Output array of subscriber docs
                }
            },
            {
                $lookup: {                               // Step 3: Lookup channels this user is subscribed to
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"     // Output array of channels the user has subscribed to
                }
            },
            {
                $addFields: {                       // Step 4: Add computed fields
                    subscribersCount: { $size: "$subscribers" },   // Total subscribers count
                    ChannelsSubscribedToCount: { $size: "$subscribedTo" }, // Total subscribed channels

                    // Step 4.1: Check if the requester is a subscriber
                    isSubscribed :{
                        $cond: {
                            if: {  
                                $in : [req.user?._id, "$subscribers.subscriber"] ,
                                // Check if current user ID exists in subscribers list
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
               $project: {  // Step 5: Select only required fields to return
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    ChannelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email: 1
                } 
            }
        ]
    )

    // no channel found
    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200).json(new ApiResponse(
        200, 
        channel[0], 
        "Channel profile fetched successfully"
    ))
})
```

#### 📌 Explanation:

- The function is designed to fetch both the **profile** and **subscription stats** of a user.
    
- It joins the `subscriptions` collection twice:
    
    - Once to get all **subscribers** of the user (i.e., who follows the channel).
        
    - Once to get all **channels the user has subscribed to**.
        
- It also computes:
    
    - The **counts** of both subscribers and subscriptions.
        
    - Whether the current logged-in user has subscribed to this channel.
        
- The final result contains only the important fields for the frontend.
    

---

### 🔹 Function: `getWatchHistory`

This function gets a user’s watch history with video and owner (uploader) details, using a nested aggregation lookup.

```js
const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)  // Match current user by _id
            },
        },
        {
            $lookup: {  // Lookup videos in user's watch history
                from: "videos",
                localField: "watchHistory",  // Array of video IDs in user document
                foreignField: "_id",
                as: "watchHistory",

                // Nested pipeline to lookup uploader (owner) info for each video
                pipeline: [
                    {
                        $lookup: {
                            from: "users",             // Join video owner data
                            localField: "owner",       // Owner field in video
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {        // Only include necessary fields
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"  // Flatten owner array to object
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200, 
        user[0], 
        "Watch history fetched successfully"
    ))
})
```

#### 📌 Explanation:

- This function fetches the **watch history** of a user.
    
- It looks up all video documents referenced in the user's `watchHistory` array.
    
- Then for each video:
    
    - It performs another `$lookup` to fetch the **uploader’s (owner’s)** details.
        
    - The owner data is flattened from an array to an object using `$first`.
        
- The result is a **fully enriched watch history**, with both video data and its uploader info ready for display.
    

---

### 🔍 Key Concepts Recap:

- **$lookup**: Used to join documents across collections.
    
- **$match**: Filters documents based on conditions.
    
- **$addFields**: Adds new computed fields.
    
- **$project**: Limits the fields returned.
    
- **$ first *: Flattens arrays returned from `$lookup`.
    
---

`getWatchHistory:`

```[User Collection]
    |
    | $match
    v
[Matched User Document]
    |
    | $lookup (from: "videos", localField: "watchHistory", foreignField: "_id", as: "watchHistory")
    v
[User Document with watchHistory Array]
    |
    | For each video in watchHistory:
    |   $lookup (from: "users", localField: "owner", foreignField: "_id", as: "owner")
    |   $project (fullName, username, avatar, coverImage)
    |   $addFields (owner: $first: "$owner")
    v
[Final User Document with Enriched watchHistory]

```


### 🧾 Explanation of Each Stage:

1. **$match**: Filters the `User` collection to find the document matching the current user's `_id`.
    
2. **$lookup (videos)**: Performs a left outer join with the `videos` collection, matching the user's `watchHistory` array of video IDs with the `_id` field in the `videos` collection. The resulting array is stored in the `watchHistory` field.
    
3. **Nested $lookup (users)**: For each video in the `watchHistory` array, performs another left outer join with the `users` collection to fetch details of the video's owner.
    
4. **$project**: Within the nested lookup, projects only the necessary fields (`fullName`, `username`, `avatar`, `coverImage`) from the owner's document.
    
5. **$addFields**: Flattens the `owner` array to a single object by taking the first element, simplifying the structure for easier access.
    

This pipeline enriches the user's watch history by embedding detailed information about each video and its owner, making it convenient for front-end consumption.