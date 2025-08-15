import mongoose from "mongoose";

const userSchema = new  mongoose.Schema({
    firstName: { type: String, required: [true, 'User name is required'], trim: true, minLength: 2},
    lastName: { type: String, required: [true, 'User name is required'], trim: true, minLength: 2},
    email: { type: String, required: [true, 'User name is required'], trim: true, minLength: 2},
    userType: {type: Number, default: 0},
    imageUrl: {type: String},
    bio: { type: String},
    categories: { type: Array(String)},
    rate: {type: Number, default: 10000},
    clerkId: {type: String, required: [true, 'Clerk is required'],},
    balance: {type: Number, default: 0},
    profile: {type: Number, default: 2},
    specialties: {type: Array(String)},
    portfolio: {type: Array(String)}

}, {timestamps: true})

const User = mongoose.model("User", userSchema)

export default User;