import mongoose from "mongoose";

const transactionsSchema = new  mongoose.Schema({
    desc: { type: String, required: [true, 'Desc is required'], trim: true, minLength: 2},
   status: { type: Number, default: 0},
   clerkId: { type: String,  required: [true, 'Clekr Id id required']},
   type: { type: Number, default: 0},
   amount: {type: Number, default: 0}

}, {timestamps: true})

const Transaction = mongoose.model("Transactions", transactionsSchema)

export default Transaction;