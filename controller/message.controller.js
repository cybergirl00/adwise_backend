import Message from "../models/message.model.js";
import User from "../models/user.model.js";





export const getChatPartners = async (req, res) => {
  try {
    const { clerkId } = req.params;

    if (!clerkId) {
      return res.status(400).json({ message: "Clerk id is required" });
    }

    // Get all messages involving this user, sorted by most recent first
    const messages = await Message.find({
      $or: [
        { senderId: clerkId },
        { recieverId: clerkId }
      ]
    })
    .sort({ createdAt: 1 })
    .select('content createdAt senderId recieverId type submissionStatus amount deadline');

    // Group messages by conversation partner
    const conversations = new Map();

    messages.forEach(message => {
      const partnerId = message.senderId.toString() === clerkId 
        ? message.recieverId.toString() 
        : message.senderId.toString();

      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          messages: [],
          latestMessage: null
        });
      }

      const conversation = conversations.get(partnerId);
      const messageData = {
        content: message.content,
        createdAt: message.createdAt,
        isFromMe: message.senderId.toString() === clerkId,
        type: message.type,
        submissionStatus: message.submissionStatus,
        amount: message.amount,
        deadline: message.deadline
      };

      conversation.messages.push(messageData);

      if (!conversation.latestMessage) {
        conversation.latestMessage = messageData;
      }
    });

    // Get user details for all partners
    const partners = await User.find({
      clerkId: { $in: Array.from(conversations.keys()) }
    }).select('clerkId firstName lastName imageUrl');

    // Combine all data
    const chatPartners = partners.map(partner => {
      const conversation = conversations.get(partner.clerkId.toString());
      
      return {
        user: {
          clerkId: partner.clerkId,
          firstName: partner.firstName,
          lastName: partner.lastName,
          imageUrl: partner.imageUrl
        },
        latestMessage: conversation.latestMessage,
        messages: conversation.messages
      };
    }).sort((a, b) => 
      new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt)
    );

    return res.status(200).json({ 
      success: true,
      message: "Chat partners retrieved successfully",
      data: chatPartners 
    });
  } catch (error) {
    console.error("Error fetching chat partners:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};