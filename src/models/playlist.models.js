/*

playlists [icon: library] {
  id string pk
  owner objectId users
  videos objectId[] videos
  name string
  description string
  createdAt Date
  updatedAt Date
}
*/

import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  videos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  owner: {  //user
    type: Schema.Types.ObjectId,
    ref: "User",
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

export const Playlist = mongoose.model("Playlist", playlistSchema);