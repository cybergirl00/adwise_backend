import Transaction from "../models/transactions.model.js";
import User from "../models/user.model.js";

export const fundWallet = async (req, res) => {
    try {
        const { clerkId, amount } = req.body;

        // Validate required fields
        if (!clerkId || !amount) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Ensure amount is a positive number
        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }

        // Find user
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update balance
        user.balance += amount;
        await user.save(); // Save the updated balance

        // Create transaction record
        const transaction = await Transaction.create({
            desc: "Wallet funding via Flutterwave",
            status: 1, 
            type: 1,  
            clerkId,
            amount,    
        });

        // Return success response
        return res.status(200).json({ 
            message: "Wallet funded successfully",
            balance: user.balance,
            transaction,
        });

    } catch (error) {
        console.error("Error funding wallet:", error);
        return res.status(500).json({ 
            message: "Internal Server Error", 
            error: error?.message 
        });
    }
};


export const getUserTransactions = async (req, res) => {
    try {
        const { clerkId } = req.params;

        if(!clerkId) {
            return res.status(400).json({message: "ClerkId is required"})
        }

        const transactions = await Transaction.find({clerkId: clerkId})

        if(!transactions) {
            return res.status(404).json({message: "Transaction not found"})
        }
        

        return  res.status(200).json({message: "Transactions found", transactions})
    } catch (error) {
       console.error("Error funding wallet:", error);
        return res.status(500).json({ 
            message: "Internal Server Error", 
            error: error?.message 
        });
    }
}