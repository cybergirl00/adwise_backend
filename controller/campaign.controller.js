import Campaigns from "../models/campaign.model.js";
import Media from "../models/media.model.js";
import Request from "../models/request.model.js";
import Transaction from "../models/transactions.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";


export const createCampaign = async (req, res) => {
  try {
    const { clerkId, title, description, budget, format, audience, mediaId, category, redirectUrl } = req.body;

    // Validate required fields
    if (!clerkId || !title || !description || !budget || !format || !audience || !mediaId || !category || !redirectUrl) {
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
    const media = await Media.findOne({ _id: mediaId });
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

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
      category,
      redirectUrl
    });

    media.campaignId = newCampaign?._id

    await media.save()

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

export const sendProjectRequest = async (req, res) => {
  try {
    const { creatorId, ownerId, title, description, category, numberofFiles, deadline, budget, requirements } = req.body;

    if(!creatorId || !ownerId || !title || !description || !category || !numberofFiles || !deadline || !budget || !requirements) {
      return res.status(400).json({message: "Please fill all fields"});
    }

    const owner = await User.findOne({ clerkId: ownerId });

    if(!owner) {
      return res.status(404).json({message: "Owner not found"})
    }

    const creator = await User.findOne({ clerkId: creatorId})

    if(!creator) {
      return res.status(404).json({message: "Creator not found"})
    }

    const existingRequest = await Request.findOne({ creatorId, ownerId, status: 1 || 0  })

    if(existingRequest) {
      return res.status(400).json({message: "Request to this creator already exists"})
    }

    const createRequest = await Request.create({
      creatorId, ownerId, title, description, category, numberofFiles, deadline, budget, requirements
    });

    owner.balance = owner.balance - budget;
    owner.pendingbalance = owner.pendingbalance + budget

    creator.pendingbalance = creator.pendingbalance + budget 



    await Message.create({
      senderId: ownerId,
      recieverId: creatorId, 
      type: 2,
      content: `${owner?.firstName} sent a project request for ${title}`,
      amount: budget,
      deadline: deadline,
      requestId: createRequest._id
    })

    await owner.save();
    await creator.save();


    return res.status(201).json({message: "Request Created", data: createRequest});
  } catch (error) {
    return res.status(500).json({message: "Internal server error", error: error.message})
  }
}

export const getCreatorRequest = async (req, res) => {
  try {
    const { clerkId } = req.params;

    if (!clerkId) {
      return res.status(400).json({ message: "Clerk ID is required" });
    }

    // Find all requests for this creator
    const userRequests = await Request.find({ creatorId: clerkId }).sort({ createdAt: -1})

    // If no requests found, return empty array
    if (!userRequests || userRequests.length === 0) {
      return res.status(200).json({ 
        message: "No requests found", 
        data: { userRequests: [], clients: [] } 
      });
    }

    // Get unique owner IDs from all requests
    const ownerIds = [...new Set(userRequests.map(request => request.ownerId))];

    // Find all clients who made these requests
    const clients = await User.find({ clerkId: { $in: ownerIds } });

    return res.status(200).json({
      message: "Requests retrieved successfully",
      data: { 
        userRequests, 
        clients: clients.reduce((acc, client) => {
          acc[client.clerkId] = client;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("Error getting creator requests:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const getCreatorRequestbetweenowner = async (req, res) => {
  try {
    const { clerkId, ownerId } = req.params;

    if (!clerkId || !ownerId) {
      return res.status(400).json({ message: "Clerk ID/Owner ID is required" });
    }

    // Find all requests for this creator
    const userRequests = await Request.findOne({ creatorId: clerkId, ownerId: ownerId, status: 1 });

    // If no requests found, return empty array
    if (!userRequests) {
      return res.status(404).json({ 
        message: "No requests found", 
      });
    }

    return res.status(200).json({
      message: "Request retrieved successfully",
      data: { 
        userRequests, 
      }
    });
  } catch (error) {
    console.error("Error getting creator requests:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const declineRequest = async (req, res) => {
  try {
    const { requestId, clerkId } = req.params;

    if(!requestId || !clerkId) {
      return res.status(400).json({message: "All fields are required"})
    }

    const user = await User.findOne({ clerkId: clerkId})

    if(!user) {
      return res.status(404).json({message: "User not found"})
    }

    const request = await Request.findOne({ _id: requestId})

    if(!request) {
      return res.status(404).json({message: "Request not found"})
    }

    const allowed = await Request.findOne({ creatorId: clerkId, _id: requestId})

    if(!allowed) {
      return res.status(400).json({ message: "You are not allowed to decline"})
    }

    request.status = 2

    user.pendingbalance = user.pendingbalance - request.budget 

    await Message.create({
      senderId: request.ownerId,
      recieverId: request.creatorId, 
      type: 2,
      content: `Creator declined project request for ${request.title}`,
      amount: request.budget,
      deadline: request.deadline,
      requestId: request._id
    })

    await request.save();
    await user.save();

    return res.status(200).json({message: "Request has been declined"})
  } catch (error) {
    console.log(error)
  }
}

export const approveRequest = async (req, res) => {
  try {
    const { requestId, clerkId } = req.params;

    if(!requestId || !clerkId) {
      return res.status(400).json({message: "All fields are required"})
    }

    const user = await User.findOne({ clerkId: clerkId})

    if(!user) {
      return res.status(404).json({message: "User not found"})
    }

    const request = await Request.findOne({ _id: requestId})

    if(!request) {
      return res.status(404).json({message: "Request not found"})
    }

    const allowed = await Request.findOne({ creatorId: clerkId, _id: requestId})

    if(!allowed) {
      return res.status(400).json({ message: "You are not allowed to approve"})
    }

    request.status = 1


    await Message.create({
      senderId: request.ownerId,
      recieverId: request.creatorId, 
      type: 2,
      content: `Creator accepted project request for ${request.title}`,
      amount: request.budget,
      deadline: request.deadline,
      requestId: request._id
    })

    await request.save();

    return res.status(200).json({message: "Request has been approved!"})
  } catch (error) {
    console.log(error)
  }
}

export const createSubmission = async (req, res) => {
  try {
    let { requestId, creatorId, title, files,    } = req.body;
    
    // Validation
    if (!requestId || !creatorId || !title || !files ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Parse if files is a string
    if (typeof files === 'string') {
      try {
        files = JSON.parse(files);
      } catch (parseError) {
        return res.status(400).json({
          message: "Invalid files format",
          error: parseError.message
        });
      }
    }

    // Validate it's an array
    if (!Array.isArray(files)) {
      return res.status(400).json({
        message: "files must be an array"
      });
    }

    const creator = await User.findOne({ clerkId: creatorId });
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const request = await Request.findOne({ _id: requestId, creatorId });
    if (!request) {  // Changed from !requestId to !request
      return res.status(404).json({ message: "Request not found" });
    }

    const existingSubmit = await  Request.findOne({ _id: requestId, submit: 1})

    if(existingSubmit) {
      return res.status(400).json({ message: "There is a media already awaiting approval"})
    }

    const existingDecline = await Media.findOne({ requestId: requestId, status: 2   })

    if(existingDecline) {
      // if there is a media file already and you want to resubmit we belive you want to update the previous ones 
      existingDecline.mediaUrl  = files;
      existingDecline.status = 0
      request.submit = 1 


      await Message.create({
      senderId: creatorId,
      recieverId: request.ownerId, // Use request.ownerId
      type: 3,
      content: `${creator.firstName} Resubmitted media files for the ad ${request.title}, currently awaiting approval`,
      requestId
    });


      await existingDecline.save();
      await request.save();

      return res.status(200).json({message: "Media file has been updated "})
    }

    // Create media - pass files directly (not wrapped in another array)
    const createMedia = await Media.create({
      clerkId: creatorId,
      ownerId: request.ownerId,
      title: title,
      description: `Media submission from creator: ${creator.firstName}`,
      mediaUrl: files,
      requestId: requestId,
    });

    // Create message
    await Message.create({
      senderId: creatorId,
      recieverId: request.ownerId, // Use request.ownerId
      type: 3,
      content: `${creator.firstName} submitted media files for the ad ${request.title}, currently awaiting approval`,
      requestId
    });

    // Update request status
    request.submit = 1;
    await request.save();

    return res.status(200).json({ 
      message: "Media files created", 
      data: { createMedia } 
    });
  } catch (error) {
    console.error("Submission error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const approverSubmission = async (req, res) => {
  try {
    const {mediaId, requestId} = req.body;

    if(!mediaId || !requestId) {
      return res.status(400).json({message: "All fields are required"})
    }

    const media = await Media.findOne({ _id: mediaId })

    if(!media ) {
      return res.status(404).json({message: "Media is not found"})
    }

    const request = await Request.findOne({ _id: requestId})

    if(!request) {
      return res.status(404).json({message: "Request not found"})
    }

    const owner = await User.findOne({ clerkId: request.ownerId })

    const creator = await User.findOne({ clerkId: request.creatorId })

    media.status = 1 
    request.submit = 2
    request.status = 3 //ended 

    creator.portfolio = [...(creator.portfolio || []), ...media.mediaUrl];


    await Message.create({
      senderId: request.ownerId,
      recieverId: request.creatorId,
      type: 3,
      content: `${owner.firstName} approved subission, creator to be credited  soon `,
      requestId
    });

    // update creator balance 
    owner.pendingbalance = owner.pendingbalance -  request.budget
    creator.balance = request.budget + creator.balance;

    owner.totalSpent = owner.totalSpent + request.budget

      await media.save();
    await request.save();
    await owner.save();
    await creator.save();

    return res.status(200).json({message: "Submission approved"})
  } catch (error) {
    return res.status(500).json({message: "Internal server error", error: error.message})
  }
}

export const declineSubmission = async (req, res) => {
  try {
    const {mediaId, requestId, note} = req.body;

    if(!mediaId || !requestId ) {
      return res.status(400).json({message: "All fields are required"})
    }

    const media = await Media.findOne({ _id: mediaId })

    if(!media ) {
      return res.status(404).json({message: "Media is not found"})
    }

    const request = await Request.findOne({ _id: requestId})

    if(!request) {
      return res.status(404).json({message: "Request not found"})
    }

    const owner = await User.findOne({ clerkId: request.ownerId })


    media.status = 2 // decline
    request.submit = 2
    media.note = note 

    if(note) {
        await Message.create({
      senderId: request.ownerId,
      recieverId: request.creatorId,
      type: 3,
      content: `${owner.firstName} declined  subission, also noted: ${note} `,
      requestId
    });
    } else {
       await Message.create({
      senderId: request.ownerId,
      recieverId: request.creatorId,
      type: 3,
      content: `${owner.firstName} decliend subission`,
      requestId
    });
    }

      await media.save();
    await request.save();

    return res.status(200).json({message: "Submission declined"})
  } catch (error) {
    return res.status(500).json({message: "Internal server error", error: error.message})
  }
}