import { Router } from "express";
import { createCampaign } from "../controller/campaign.controller.js";

const campaignRouter = Router();

campaignRouter.get('/', (req, res) => {
  res.send('Ad route');
});

campaignRouter.post('/create', createCampaign)

export default campaignRouter;
