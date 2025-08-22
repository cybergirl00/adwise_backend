import { Router } from "express";
import { approveRequest, approverSubmission, createCampaign, createSubmission, declineRequest, declineSubmission, getCreatorRequest, getCreatorRequestbetweenowner, sendProjectRequest } from "../controller/campaign.controller.js";

const campaignRouter = Router();

campaignRouter.get('/', (req, res) => {
  res.send('Ad route');
});

campaignRouter.post('/create', createCampaign)
campaignRouter.post('/submit', createSubmission)
campaignRouter.post('/submit/decline', declineSubmission)
campaignRouter.post('/submit/approve', approverSubmission)
// request
campaignRouter.post('/request/create', sendProjectRequest)
campaignRouter.get('/request/getCreatorRequest/:clerkId', getCreatorRequest);
campaignRouter.get('/request/decline/:requestId/:clerkId', declineRequest)
campaignRouter.get('/request/approve/:requestId/:clerkId', approveRequest)
campaignRouter.get('/request/betweenOwner/:clerkId/:ownerId', getCreatorRequestbetweenowner)

export default campaignRouter;
