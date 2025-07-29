import mongoose from "mongoose";

const singleScriptSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  videoUrl: { type: String },
  taskId: {type: String}
});

const scriptSchema = new mongoose.Schema(
  {
    clerkId: {type: String, required: true},
    scripts: [singleScriptSchema],
    status: {type: Number, default: 1}
  },
  { timestamps: true }
);

const Script = mongoose.model("Script", scriptSchema);
export default Script;


// status 1 - still generating from freepik and 2 when it is completed and endpoint is send from freepik