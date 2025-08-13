import mongoose from "mongoose";

const mediaSchema = new  mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true, minLength: 2},
    description: { type: String, required: [true, 'Description is required'], trim: true, minLength: 2},
   mediaUrl: { type: String, required: [true, "Media is required"]},
   clerkId: { type: String,  required: [true, 'User Id id required']},
   ownerId: { type: String}

}, {timestamps: true})

const Media = mongoose.model("Media", mediaSchema)

export default Media;