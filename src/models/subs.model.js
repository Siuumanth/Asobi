/*
subscriptions [icon: money] {
  id string pk
  subscriber objectId users
  channel objectId users
  createdAt Date
  updatedAt Date
}
*/

import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  channel: {
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

export const Subscription = mongoose.model("Subscription", subscriptionSchema);