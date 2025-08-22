import mongoose from "mongoose";

const messageSchema = new  mongoose.Schema({
    senderId: { type: String, required: [true, 'Sender Id is required'],},
    recieverId: { type: String, required: [true, 'Reciever is required']},
   type: { type: Number, default: 0},
   content: { type: String},
   submissionStatus: {type: Number, default: 0},
   amount: {type: Number},
   deadline: {type: Date},
   requestId: {type: String}

}, {timestamps: true})

const Message = mongoose.model("Messages", messageSchema)

export default Message;