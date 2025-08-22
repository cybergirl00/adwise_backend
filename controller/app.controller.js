
import App from "../models/apps.model.js";
import Audience from "../models/audience.model.js";
import Category from "../models/category.model.js";

import User from "../models/user.model.js";
import crypto from 'crypto';

const generateApiKey = () => {
  const randomString = crypto.randomBytes(18).toString('hex'); // Generates 36-character hex string
  const segments = [
    'ad_live',
    randomString.substring(0, 9), 
    randomString.substring(9, 18),
  ];
  return segments.join('_');
};

export const createApp = async (req, res) => {
  try {
    const { clerkId, categoryName, title, audienceName } = req.body;

    // Fixed validation (had incorrect condition)
    if (!clerkId || !categoryName || !title || !audienceName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const developer = await User.findOne({ clerkId: clerkId, userType: 2 });
    if (!developer) {
      return res.status(404).json({ message: "Developer not found" });
    }

   
    let  category = await Category.findOne({ name: categoryName });

    let audience = await Audience.findOne({ name: audienceName })

    if (!category) {
   category =  await Category.create({
        name: categoryName
    })

    }

     if (!audience) {
   audience =  await Audience.create({
        name: audienceName
    })

    }

    const apiKey = generateApiKey();

    // Added await and proper response handling
    const newApp = await App.create({
      title,
      categoryId: category?._id,
      audienceId: audience?._id,
      clerkId,
      apiKey,
    });

    return res.status(201).json({ 
      message: "App created successfully",
      data: newApp,
      apiKey: apiKey,
      categoryName
    });

  } catch (error) {
    console.error("Error in createApp:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

export const getuserApp = async (req, res) => {
    try {
        const { clerkId } = req.params;

        if (!clerkId) {
            return res.status(400).json({ message: "Clerk ID is required" });
        }

        // Find all apps for the user
        const userApps = await App.find({ clerkId });

        if (!userApps.length) {
            return res.status(200).json({ 
                message: "No apps found for this user", 
                data: [] 
            });
        }

        // Get all unique category and audience IDs
        const categoryIds = [...new Set(userApps.map(app => app.categoryId))];
        const audienceIds = [...new Set(userApps.map(app => app.audienceId))];

        // Fetch all related categories and audiences in parallel
        const [categories, audiences] = await Promise.all([
            Category.find({ _id: { $in: categoryIds } }),
            Audience.find({ _id: { $in: audienceIds } })
        ]);

        // Create lookup maps for quick reference
        const categoryMap = categories.reduce((map, category) => {
            map[category._id] = category;
            return map;
        }, {});

        const audienceMap = audiences.reduce((map, audience) => {
            map[audience._id] = audience;
            return map;
        }, {});

        // Enrich the apps data with category and audience details
        const enrichedApps = userApps.map(app => ({
            ...app.toObject(),
            category: categoryMap[app.categoryId] || null,
            audience: audienceMap[app.audienceId] || null
        }));

        return res.status(200).json({
            message: "Apps retrieved successfully",
            data: enrichedApps,
            count: userApps.length
        });

    } catch (error) {
        console.error("Error in getuserApp:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};