/*

videos [icon: video] {
  id string pk
  owner objectId users
  file string
  thumbnail string
  title string
  description string
  duration number
  views number
  isPublished boolean
  createdAt Date
  updatedAt Date
}

*/

import mongoose, {Schema} from mongoose;


const videoSchema = new Schema({
  videoFile: {
    type: String,  //cloudinary url
    required: true,
  },
  thumbnail: {
    type: String,  //cloudinary url
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  owner: {
    type : Schema.Types.ObjectId,
    ref: "User",
  },
},
{timestamps: true}
)
  

export const Video = mongoose.model("Video", videoSchema);