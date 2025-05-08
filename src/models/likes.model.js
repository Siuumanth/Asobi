/*

likes [icon: thumbs-up] {
  id string pk
  video objectId videos
  comment objectId comments
  tweet objectId tweets
  likedBy objectId users
  createdAt Date
  updatedAt Date
}

*/

import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: "Tweet",
    required: true,
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
});
  

export const Like = mongoose.model("Like", likeSchema);