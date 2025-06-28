import mongoose from "mongoose";
import { DATABASE_URL, NODE_ENV } from "../config/env.js";

if(!DATABASE_URL) {
    throw new Error('Please define a mongodb url enviroment in your env.local')
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DATABASE_URL);

        console.log("Database Connected");
    } catch (error) {
        console.error("Error connecting ", error)

        process.exit(1)
    }
}


export default connectToDatabase