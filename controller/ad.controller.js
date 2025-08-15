import OpenAI from "openai";
import { FREEPIK_API_KEY, FREEPIK_WEBHOOK_SECRET, OPENROUTER_API_KEY, VEO3_API_KEY } from "../config/env.js";
import { GENERATE_SCRIPT_PROMPT } from "../services/Prompt.js";
import Script from "../models/script.model.js";
import axios from "axios";
import crypto from 'crypto'
import Media from "../models/media.model.js";
import User from "../models/user.model.js";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

const apiKey = VEO3_API_KEY;
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

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
const response = await fetch('https://api.veo3api.ai/api/v1/veo/generate', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      prompt: prompt,
      model: "veo3",
      aspectRatio: "16:9",
      watermark: "MyBrand"
    })
  });
  
  const result = await response.json();
  const taskId =  result.data.taskId;

await Script.findByIdAndUpdate(created._id, {
  $set: { "scripts.$[].taskId": taskId } 
});

return res.status(201).json({ message: "Scripts saved", data: created, taskId });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const backgroundTask = async () => {}


export const createMedia = async (req, res) => {
  try {
    const { title, description, mediaUrl, clerkId, ownerId } = req.body;

    if (!title || !description || !mediaUrl || !clerkId) {
      return res.status(400).json({
        message: "Title, description, mediaUrl, and clerkId are required.",
      });
    }

    const creator = await User.findOne({ clerkId });
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    if (ownerId) {
      const owner = await User.findOne({ clerkId: ownerId });
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }
    }
    const createdMedia = await Media.create({
      title,
      description,
      mediaUrl,
      clerkId,
      ownerId: ownerId || null,
    });

    return res.status(201).json({
      message: "Media created successfully",
      data: createdMedia,
    });

  } catch (error) {
    console.error("CreateMedia Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getUserMedia = async (req, res) => {
  try {
    const { ownerId} = req.params;

    if(!ownerId) {
      return res.status(400).json({ message: "Owner Id id required"})
    }

    const media = await Media.find({ ownerId: ownerId})

    if(!media) {
      return res.status(404).json({ message: "Owner is not found", media})
    }

    return res.status(200).json({ message: "Media found", data: media})
  } catch (error) {
    return res.status(500).json({ message: "Inter server Error ", error: error?.message})
  }
}