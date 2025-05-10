/*

comments [icon: comment] {
  id string pk
  targetType string // 'video' | 'tweet'
  targetId objectId
  owner objectId users
  content string
  createdAt Date
  updatedAt Date
}
*/


import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
  targetType: {
    type: String,           // 'video' or 'tweet'
    enum: ['video', 'tweet'],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId, // ID of the video or tweet
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",            // user id
    required: true,         // user id is required
  },
  content: {
    type: String,           // comment content
    required: true,         // comment content is required    
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

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
