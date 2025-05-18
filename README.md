# ASOBI – YouTube Clone Backend

ASOBI is the backend of a YouTube-inspired video sharing platform. Built with **Node.js**, **Express**, and **MongoDB**, it includes secure user authentication, video uploads, likes, comments, subscriptions, and search features. APIs are production-ready and tested via Postman.

---

## Schema:

![schema](https://github.com/Siuumanth/Asobi/blob/main/Asobi-notes/schema.png?raw=true)


---


## Features

- JWT-based authentication (login, register, logout, refresh-token)
- Secure video upload (Cloudinary)
- Protected routes with middleware (`verifyJWT`, `asyncHandler`)
- User profiles and channel views
- Search across users and videos
- MongoDB Aggregation pipelines for filtering, sorting, and pagination
- Like/Unlike videos
- Comments with add, update, delete functionality
- Subscribe/Unsubscribe to channels
- Rate limiting to protect API endpoints

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **File Uploads**: Cloudinary
- **Security**: JWT verification, Rate limiting, input validation, error handling
- **Tools**: Postman, Nodemon, dotenv

---

## Folder Structure

src/


├── models/          # Mongoose schemas for User, Video, Comment, etc.

├── routes/          # Modular Express routers for each domain

├── controllers/     # Logic for each route (e.g., search, upload)

├── middlewares/     # JWT verification, asyncHandler, validators

├── utils/           # API Error/Response classes, Cloudinary upload helpers

└── index.js         # Entry point of the application



---

## API Endpoints Overview

| Domain        | Route Prefix          | Description                             |
|---------------|-----------------------|-----------------------------------------|
| Auth          | `/api/v1/users`       | Register, Login, Logout, Profile        |
| Videos        | `/api/v1/videos`      | Publish, View, Edit, Delete, Like       |
| Comments      | `/api/v1/comments`    | Add, Update, Delete                     |
| Likes         | `/api/v1/likes`       | Toggle Like, View Liked Videos          |
| Subscriptions | `/api/v1/subscriptions` | Subscribe, Unsubscribe, List Subs     |
| Search        | `/api/v1/search`      | Search Users and Videos                 |
| Tweets (optional) | `/api/v1/tweets` | Create or Delete a tweet-like object    |

---

## Testing

- All APIs tested using Postman
- Use query parameters for pagination, search, and sorting
- Example:
GET /api/v1/search?query=asobi
GET /api/v1/videos/watch?v=<videoId>

---

## Authentication

- JWT stored in HttpOnly cookies
- Protected routes require `verifyJWT` middleware
- Refresh tokens supported

---

## Setup Instructions

1. Clone this repo  
 ```bash
 git clone https://github.com/your-username/Asobi.git
 cd Asobi
```

2. Install dependencies:
```bash
npm install
```

4. Set up .env
```js
# Server Configuration
PORT=7003
CORS_ORIGIN=*  # Set to your frontend domain in production (e.g., http://yourdomain.com)

# MongoDB Configuration
MONGO_USER=your_mongo_user
MONGO_PW=your_mongo_password
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net
DB_NAME=asobi

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d  # e.g., 1d, 12h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d  # e.g., 7d, 10d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Environment
NODE_ENV=development

```

4. Run
```bash
npm run dev
```

#### Author
Made by a backend-focused developer learning fullstack concepts via project-based building.
If you liked this project or want to connect, reach out.



