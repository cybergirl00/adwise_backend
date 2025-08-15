import Campaigns from "../models/campaign.model.js";
import Media from "../models/media.model.js";
import Transaction from "../models/transactions.model.js";
import User from "../models/user.model.js";


export const createCampaign = async (req, res) => {
  try {
    const { clerkId, title, description, budget, format, audience, mediaId } = req.body;

    // Validate required fields
    if (!clerkId || !title || !description || !budget || !format || !audience || !mediaId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate budget is a positive number
    if (typeof budget !== "number" || budget <= 0) {
      return res.status(400).json({ message: "Budget must be a positive number" });
    }

    // Check if user exists
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has sufficient balance
    if (user.balance < budget) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ✅ Optional: Check if mediaId exists before proceeding
    // const mediaExists = await Media.exists({ _id: mediaId });
    // if (!mediaExists) {
    //   return res.status(404).json({ message: "Media not found" });
    // }

    // Deduct balance and create campaign
    user.balance -= budget;
    await user.save();

    const newCampaign = await Campaigns.create({
      clerkId,
      title,
      description,
      budget,
      format,
      audience,
      mediaId,
    });

    await Transaction.create({
                desc: `Campaign  funding for ${title}`,
                status: 1, 
                type: 2,  
                clerkId,
                amount: budget,    
            });

    return res.status(201).json({ 
      message: "Campaign created successfully", 
      data: newCampaign 
    });

  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message // Include error details for debugging
    });
  }
};