import mongoose from "mongoose";

const appSchema = new  mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true, minLength: 2},
    apiKey: { type: String, required: [true, 'Description is required'], trim: true, minLength: 2},
   clerkId: { type: String,  required: [true, 'Creator Id id required']},
   categoryId: {type: String, required: [true, "Category is required"]},
   audienceId: {type: String, required: [true, "Audience  is required"]},
   impression: {type: Number, default: 0},
   click: {type: Number, default: 0},
   earnings: {type: Number, default: 0},

}, {timestamps: true})

const App = mongoose.model("Apps", appSchema)

export default App;