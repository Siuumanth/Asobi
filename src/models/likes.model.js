/*
likes [icon: thumbs-up] {
  id string pk
  targetType string // 'video', 'comment', 'tweet'
  targetId objectId
  likedBy objectId user
  createdAt Date
  updatedAt Date
}
*/

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
  targetType: {
    type: String,
    enum: ['video', 'comment', 'tweet'],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
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

// adding aggregation pipeline
likeSchema.plugin(mongooseAggregatePaginate);

export const Like = mongoose.model("Like", likeSchema);
