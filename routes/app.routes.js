import { Router } from "express";
import { createApp, getuserApp } from "../controller/app.controller.js";
import { getMatchingCampaigns, verifyApiKey } from "../controller/ad.controller.js";

const appRouter = Router();

appRouter.get('/', (req, res) => {
  res.send('App route');
});

appRouter.post('/create', createApp)
appRouter.get('/getUserApp/:clerkId', getuserApp)

// sdk



export default appRouter;
