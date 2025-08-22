import mongoose from "mongoose";

const audienceSchema = new  mongoose.Schema({
   name: {type: String, required: [true]}

}, {timestamps: true})

const Audience = mongoose.model("Audience", audienceSchema)

export default Audience;