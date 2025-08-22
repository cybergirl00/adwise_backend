import { Router } from "express";
import {  createMedia, generateAIScript, getMatchingCampaigns, getUserMedia, handleClick, verifyApiKey } from "../controller/ad.controller.js";

const adRouter = Router();

adRouter.get('/', (req, res) => {
  res.send('Ad route');
});

adRouter.post('/generateScript', generateAIScript)
// adRouter.post("/webhook/freepik", FREEPEKWebhook);

adRouter.post('/createMedia', createMedia)
adRouter.get('/getMedia/:ownerId', getUserMedia)


adRouter.get('/campaigns', verifyApiKey, getMatchingCampaigns)
adRouter.post('/click', verifyApiKey, handleClick)


export default adRouter;
