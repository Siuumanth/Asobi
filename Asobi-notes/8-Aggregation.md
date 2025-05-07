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
