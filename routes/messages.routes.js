import { Router } from "express";
import { getChatPartners, } from "../controller/message.controller.js";

const messageRouter = Router();

messageRouter.get('/', (req, res) => {
  res.send('Ad route');
});

// messageRouter.get('/getMessages/:clerkId', getUserMessages)
messageRouter.get('/partners/:clerkId', getChatPartners)

export default messageRouter;
