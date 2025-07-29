import { Router } from "express";
import { FREEPEKWebhook, generateAIScript } from "../controller/ad.controller.js";

const adRouter = Router();

adRouter.get('/', (req, res) => {
  res.send('Ad route');
});

adRouter.post('/generateScript', generateAIScript)
adRouter.post("/webhook/freepik", FREEPEKWebhook);

export default adRouter;
