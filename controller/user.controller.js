import { CLERK_SECRET_KEY } from "../config/env.js";
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
            const hasProfileData = rate || bio || specialties || portfolio || imageUrl;
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