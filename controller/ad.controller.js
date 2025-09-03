import OpenAI from "openai";
import { FREEPIK_API_KEY, FREEPIK_WEBHOOK_SECRET, OPENROUTER_API_KEY, VEO3_API_KEY } from "../config/env.js";
import { GENERATE_SCRIPT_PROMPT } from "../services/Prompt.js";
import Script from "../models/script.model.js";
import axios from "axios";
import crypto from 'crypto'
import Media from "../models/media.model.js";
import User from "../models/user.model.js";
import App from "../models/apps.model.js";
import Category from "../models/category.model.js";
import Audience from "../models/audience.model.js";
import Campaigns from "../models/campaign.model.js";
import Transaction from "../models/transactions.model.js";

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
      status: 1 
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

    const media = await Media.find({ ownerId: ownerId, status: 1 })

    if(!media) {
      return res.status(404).json({ message: "Owner is not found", media})
    }

    return res.status(200).json({ message: "Media found", data: media})
  } catch (error) {
    return res.status(500).json({ message: "Inter server Error ", error: error?.message})
  }
}


export const getUserMediagallery = async (req, res) => {
  try {
    const { ownerId} = req.params;

    if(!ownerId) {
      return res.status(400).json({ message: "Owner Id id required"})
    }

    const media = await Media.find({ ownerId: ownerId,  }).sort({ createdAt: -1 })

    if(!media) {
      return res.status(404).json({ message: "Owner is not found", media})
    }

    return res.status(200).json({ message: "Media found", data: media})
  } catch (error) {
    return res.status(500).json({ message: "Inter server Error ", error: error?.message})
  }
}


export const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  try {
    const app = await App.findOne({ apiKey })
      .populate({
        path: 'audienceId',
        select: 'name'
      })
      .populate({
        path: 'categoryId',
        select: 'name'
      });
    
    if (!app) return res.status(403).json({ error: 'Invalid API key' });
    
    
    req.appData = {
      app,
      audienceId: app.audienceId,
      categoryId: app.categoryId
    };
    
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



// export const getMatchingCampaigns = async (req, res) => {
//  try {
//     const { audienceId, categoryId } = req.appData;

//     console.log(audienceId, categoryId)

//     const audience = await Audience.findOne({ _id: audienceId })

//     if(!audience) {
//       return res.status(404).json({message: "Audience not found"})
//     }

//     const category = await Category.findOne({ _id: categoryId })

//     if(!category) {
//       return res.status(404).json({message: "Category not found"})
//     }
//     // 1. Find campaigns matching audience name
//     const campaigns = await Campaigns.find({
//       audience: audience.name,
//       budget: { $gte: 15 }
//       // status: 1 
//     }).lean();

//     console.log('This is campaigns ', campaigns)

//     // 2. Get media for each campaign
//     const campaignsWithMedia = await Promise.all(
//       campaigns.map(async campaign => {
//         const media = await Media.findById(campaign.mediaId)
//           .select('mediaUrl title')
//           .lean();
        
//         return {
//           ...campaign,
//           mediaUrls: media?.mediaUrl || [],
//           mediaTitle: media?.title || ''
//         };
//       })
//     );

//     // 3. Filter campaigns with valid media
//     const validCampaigns = campaignsWithMedia.filter(
//       c => c.mediaUrls.length > 0
//     );

//     // 4. Shuffle campaigns for random rotation
//     const shuffledCampaigns = validCampaigns.sort(
//       () => 0.5 - Math.random()
//     );

//     res.json({ 
//       success: true,
//       campaigns: shuffledCampaigns,
//       audience: audience?.name,
//       category: category.name
//     });
//   } catch (error) {
//     console.error('Campaign fetch error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to fetch campaigns' 
//     });
//   }

// }


export const getMatchingCampaigns = async (req, res) => {
  try {
    const { audienceId, categoryId } = req.appData;

    const audience = await Audience.findById(audienceId);
    if (!audience) {
      return res.status(404).json({ message: "Audience not found" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 1. Find campaigns matching audience name
    const campaigns = await Campaigns.find({
      audience: audience.name,
      budget: { $gte: 15 }
    }).lean();

    // 2. Attach media details
    const campaignsWithMedia = await Promise.all(
      campaigns.map(async campaign => {
        const media = await Media.findById(campaign.mediaId)
          .select('mediaUrl title')
          .lean();

         

        if (!media) return null;

        return {
          ...campaign,
          media: {
            mediaId: media._id.toString(),     
            urls: media.mediaUrl,             
            title: media.title
          }
        };
      })
    );

    // 3. Filter out nulls
    const validCampaigns = campaignsWithMedia.filter(Boolean);

    // 4. Shuffle campaigns
    const shuffledCampaigns = validCampaigns.sort(() => 0.5 - Math.random());

    res.json({
      success: true,
      campaigns: shuffledCampaigns,
      audience: audience?.name,
      category: category.name
    });
  } catch (error) {
    console.error('Campaign fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
};


export const handleClick = async (req, res) => {
  try {
    const { mediaId, deviceId } = req.body;
    const { app } = req.appData;

    console.log('This is the device id ', deviceId)

    if (!mediaId || !deviceId) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ message: "Media not found" });

    const owner = await User.findOne({ clerkId: media.ownerId, userType: 1 });
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const developer = await User.findOne({ clerkId: app.clerkId, userType: 2 });
    if (!developer) return res.status(404).json({ message: "Developer not found" });

    const campaign = await Campaigns.findById(media.campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // ✅ Check if device already clicked
    if (campaign.clickIds.includes(deviceId)) {
      return res.status(200).json({
        message: "Click already recorded for this device",
        link: campaign.redirectUrl
      });
    }

    if (owner.balance < 15) {
      return res.status(400).json({ message: "Business does not have enough balance" });
    }

    // Deduct & credit
    // owner.balance -= 15;
    developer.balance += 10;
    campaign.budget -= 15; 

    // Save deviceId into campaign.clickIds
    campaign.clickIds.push(deviceId);

    // Update app stats
    app.click += 1;
    app.earnings += 15;

    // Record transactions
    await Transaction.create({
      desc: `Your ad just reached a user`,
      status: 1,
      clerkId: owner.clerkId,
      type: 2,
      amount: 15
    });

    await Transaction.create({
      desc: `One click from your ${app.title} app`,
      status: 1,
      clerkId: developer.clerkId,
      type: 1,
      amount: 10   // ✅ correct amount
    });

    // Save everything
    await Promise.all([owner.save(), developer.save(), campaign.save(), app.save()]);

    return res.status(200).json({
      message: "Click successful, redirect user",
      link: campaign.redirectUrl
    });

  } catch (error) {
    console.log("handleClick error:", error.message);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
