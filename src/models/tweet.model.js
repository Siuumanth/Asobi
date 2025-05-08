/*
tweets [icon: twitter] {
  id string pk
  owner objectId users
  content string
  createdAt Date
  updatedAt Date
}

*/

import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({    
  owner: {
    type: Schema.Types.ObjectId,    //user id
    ref: "User",
    required: true, //user id is required
  },
  content: {
    type: String,   //tweet content
    required: true, //tweet content is required    
  },    
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,    
  },    
  comments: [
    {    
      type: Schema.Types.ObjectId,    //comment id
      ref: "Comment",
      required: true, //comment id is required
    },
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,    //like id
      ref: "Like",    
      required: true, //like id is required
    },
  ],
});

export const Tweet = mongoose.model("Tweet", tweetSchema);