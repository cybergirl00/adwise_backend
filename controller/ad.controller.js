import OpenAI from "openai";
import { FREEPIK_API_KEY, FREEPIK_WEBHOOK_SECRET, OPENROUTER_API_KEY } from "../config/env.js";
import { GENERATE_SCRIPT_PROMPT } from "../services/Prompt.js";
import Script from "../models/script.model.js";
import axios from "axios";
import crypto from 'crypto'

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

export const generateAIScript = async (req, res) => {
  try {
    const { script } = req.body;

    if (!script) {
      return res.status(400).json({ message: "Script is missing" });
    }

    const prompt = GENERATE_SCRIPT_PROMPT.replace("{topic}", script);
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      return res.status(500).json({ message: "No script content returned" });
    }

    let parsedScripts;

    try {
      if (messageContent.startsWith("[")) {
        parsedScripts = JSON.parse(messageContent);
      } else {
        const match = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          parsedScripts = JSON.parse(match[1]);
        } else {
          const jsonMatch = messageContent.match(/\[.*\]/s);
          if (jsonMatch) {
            parsedScripts = JSON.parse(jsonMatch[0]);
          } else {
            return res
              .status(500)
              .json({ message: "Failed to find JSON array in response" });
          }
        }
      }
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Invalid JSON format from AI", error: err.message });
    }

    const created = await Script.create({
      clerkId: "ser_30XwUFjTM9FH4VsdmBVm14sSR3m",
      scripts: parsedScripts,
    });

    // GENERATE VIDEO WITH FREEPEK BASED ON EACH SCRIPTS 

  const createVideoRes = await axios.post(
  "https://api.freepik.com/v1/ai/image-to-video/minimax-hailuo-02-768p",
  {
    webhook_url: "https://adwise-backend-zk7u.onrender.com/api/v1/ad/webhook/freepik",
    prompt: JSON.stringify(created.scripts),
    prompt_optimizer: true,
    first_frame_image: "https://img.freepik.com/free-photo/beautiful-sunset-over-mountains_123456-7890.jpg",
    duration: 30
  },
  {
    headers: {
      "x-freepik-api-key": FREEPIK_API_KEY,
      "Content-Type": "application/json"
    }
  }
);

const taskId = createVideoRes.data?.task_id;

await Script.findByIdAndUpdate(created._id, {
  $set: { "scripts.$[].taskId": taskId } 
});

return res.status(201).json({ message: "Scripts saved", data: created, taskId });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const FREEPEKWebhook = async (req, res) => {
  try {
    const secret = FREEPIK_WEBHOOK_SECRET;
    const signature = req.headers["x-webhook-signature"];

    // Verify webhook signature
    const expected = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { task_id, status, video_url } = req.body;

    if (status === "IN_PROGRESS") {
      return res.status(200).json({ message: "Still processing" });
    }

    if (status === "COMPLETED") {
      // Update matching script(s)
      await Script.updateMany(
        { "scripts.taskId": task_id },
        {
          $set: {
            "scripts.$[elem].videoUrl": video_url,
            "status": 2,
          },
        },
        {
          arrayFilters: [{ "elem.taskId": task_id }],
        }
      );
    }

    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ message: "Internal error" });
  }
};