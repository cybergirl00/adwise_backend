import mongoose from "mongoose";

const requestSchema = new  mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true, minLength: 2},
    description: { type: String, required: [true, 'Description is required'], trim: true, minLength: 2},
   creatorId: { type: String,  required: [true, 'Creator Id id required']},
   ownerId: { type: String, required: [true, "OwnerId id required"]},
   category: {type: String, required: [true]},
   numberofFiles: {type: Number},
   deadline: {type: Date},
   budget: {type: Number},
   status: {type: Number, default: 0},
   requirements: {type: Array(String)},
   submit: { type: Number, default: 0}

}, {timestamps: true})

const Request = mongoose.model("Request", requestSchema)

export default Request;