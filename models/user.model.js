import mongoose from "mongoose";

const userSchema = new  mongoose.Schema({
    firstName: { type: String, required: [true, 'User name is required'], trim: true, minLength: 2},
    lastName: { type: String, required: [true, 'User name is required'], trim: true, minLength: 2},
    email: { type: String, required: [true, 'User name is required'], trim: true, minLength: 2},
    userType: {type: Number, default: 0},
    imageUrl: (type: String)
}, {timestamps: true})

const User = mongoose.model("User", userSchema)

export default User;