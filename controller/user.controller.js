import { CLERK_SECRET_KEY } from "../config/env.js";
import App from "../models/apps.model.js";
import Campaigns from "../models/campaign.model.js";
import Message from "../models/message.model.js";
import Request from "../models/request.model.js";
import Transaction from "../models/transactions.model.js";
import User from "../models/user.model.js";
import { createClerkClient } from '@clerk/backend'


const clerk = createClerkClient({ 
  secretKey: CLERK_SECRET_KEY 
});
export const completeProfile = async (req, res) => {
    try {
        const { rate, bio, specialties, portfolio, imageUrl, clerkId } = req.body;

        if (!clerkId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findOne({ clerkId: clerkId });

        if (!user) {
            return res.status(404).json({ message: "User not found" }); // Fixed typo in "found"
        }

        // Update user fields only if they're provided in the request
        if (rate !== undefined) user.rate = rate;
        if (bio !== undefined) user.bio = bio;
        if (specialties !== undefined) user.specialties = specialties;
        if (imageUrl !== undefined) {
            user.imageUrl = imageUrl;
        await clerk.users.updateUser(clerkId, {
            image_url: imageUrl
        })
        }
        
        // Handle portfolio array correctly
        if (portfolio !== undefined) {
            user.portfolio = [...(user.portfolio || []), ...(Array.isArray(portfolio) ? portfolio : [portfolio])];
        }

        // Check profile completion
        if (user.profile === 2) {
            const hasProfileData = rate || bio || specialties  || imageUrl;
            if (hasProfileData) {
                user.profile = 1; // 1 = completed, 2 = pending
            }
        }

        await user.save();

        return res.status(200).json({ message: "Profile Updated!", user });
    } catch (error) {
        console.error("Error updating profile:", error); // Log the error for debugging
        return res.status(500).json({ // Fixed typo in .json()
            message: "Internal server error",
            error: error.message
        });
    }
};


export const getUserbyClerkId = async (req, res) => {
    try {
        const { clerkId } = req.params;

        if(!clerkId) {
            return res.status(400).json({message: "Clerk ID is required"})
        }

        const user = await User.findOne({ clerkId })

        if(!user) {
            return res.status(404).json({message: "User not found"})
        }

        return res.status(200).json({ message: "User found", user})
    } catch (error) {
        return res.status(500).json({ message: "Internal server error"})
    }
}

export const getCreators = async (req, res) => {
    try {
        const creators = await User.find({ userType: 3, profile: 1});

        if(!creators) {
            return res.status(404).json({ message: "No creator found"})
        }


        return res.status(200).json({ message: "Creators found!", creators });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error "})
    }
}

export const getCreatorbyId = async (req, res) => {
    try {

        const { id } = req.params;

        if(!id) {
            return res.status(500).json({ message: "ID is required"})
        }
        const creator = await User.findOne({ _id: id,  userType: 3, profile: 1});

        if(!creator) {
            return res.status(404).json({ message: "No creator found"})
        }


        return res.status(200).json({ message: "Creator found!", data: {creator,   reviews: [
      {
        id: '1',
        rating: 5,
        comment: 'Excellent work on our product launch video. Highly recommended!',
        author: 'TechCorp Nigeria',
        date: '2024-01-15'
      }
    ]} });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error "})
    }
}


export const getAppData = async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId) return res.status(400).json({ message: "Clerk id is required" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await Transaction.find({ clerkId: user?.clerkId }).limit(5)

    let data = null;

    // Business
    if (user.userType === 1) {
      const campaigns = await Campaigns.find({ clerkId: user.clerkId });
      const hiredCreators = await Request.find({
        creatorId: { $ne: user.clerkId },
        status: { $in: [1, 3] },
      });

      const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const campaignsReached = campaigns.reduce((sum, c) => sum + (c.clickIds?.length || 0), 0);

      data = {
        totalCampaigns: campaigns.length,
        totalSpent,
        creatorsHired: hiredCreators.length,
        campaignsReached,
        transactions,
        
      };

      return res.status(200).json({ message: "Business data found", data });
    }

    // Developer
    if (user.userType === 2) {
      const apps = await App.find({ clerkId: user.clerkId });

      const totalEarnings = apps.reduce((sum, a) => sum + (a.earnings || 0), 0);
      const totalClicks = apps.reduce((sum, a) => sum + (a.click || 0), 0);

        // Current month/year
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = Jan
  const currentYear = now.getFullYear();


       const monthlyRevenue = apps.reduce((sum, app) => {
    const date = app.updatedAt || app.createdAt;
    if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      return sum + (app.earnings || 0);
    }
    return sum;
  }, 0);


      data = {
        totalEarnings,
        activeApps: apps.length,
        totalClicks,
        monthlyRevenue,
        transactions
      };

      return res.status(200).json({ message: "Developer data found", data });
    }

    // Creator
    if (user.userType === 3) {
      const activeProjects = await Request.find({ creatorId: user.clerkId, status: 1 });

      // Earnings
      const earningsAgg = await Request.aggregate([
        { $match: { creatorId: user.clerkId, } },
        { $group: { _id: null, total: { $sum: "$budget" } } },
      ]);
      const totalEarnings = earningsAgg[0]?.total || 0;

      // Unique conversations
      const messagesAgg = await Message.aggregate([
        {
          $match: {
            $or: [{ senderId: user.clerkId }, { receiverId: user.clerkId }],
          },
        },
        {
          $group: {
            _id: {
              sender: "$senderId",
              receiver: "$receiverId",
            },
          },
        },
      ]);

      data = {
        totalEarnings,
        activeProjects: activeProjects.length,
        messages: messagesAgg.length,
        profile: user.profile,
        transactions
      };

      return res.status(200).json({ message: "Creator data found", data });
    }

    return res.status(400).json({ message: "Invalid user type" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
