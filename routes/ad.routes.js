import { Router } from "express";
import {  createMedia, generateAIScript } from "../controller/ad.controller.js";

const adRouter = Router();

adRouter.get('/', (req, res) => {
  res.send('Ad route');
});

adRouter.post('/generateScript', generateAIScript)
// adRouter.post("/webhook/freepik", FREEPEKWebhook);

adRouter.post('/createMedia', createMedia)

export default adRouter;
