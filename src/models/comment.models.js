/*

comments [icon: comment] {
  id string pk
  video objectId videos
  owner objectId users
  content string
  createdAt Date
  updatedAt Date
}
*/


import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,    //video id
    ref: "Video",
    required: true, //video id is required
  },        
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",    //user id
    required: true, //user id is required
  },
  content: {
    type: String,   //comment content
    required: true, //comment content is required    
  },
  createdAt: {
    type: Date, 
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Comment = mongoose.model("Comment", commentSchema);
  