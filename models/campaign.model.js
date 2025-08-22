import mongoose from "mongoose";

const campaignSchema = new  mongoose.Schema({
    title: { type: String, required: [true, 'title is required'], trim: true, minLength: 2},
   description: { type: String,},
   clerkId: { type: String,  required: [true, 'Clerk Id id required']},
   audience: { type: String,},
   budget: {type: Number, default: 0},
   mediaId: {type: String, required: [true, "Media Ad is required"]},
   format: {type: String},
   redirectUrl: {type: String, default: 'https://adwise.vercel.app'},
   clickIds: {type: Array(String), default: []}

}, {timestamps: true})

const Campaigns = mongoose.model("Campaigns", campaignSchema)

export default Campaigns;