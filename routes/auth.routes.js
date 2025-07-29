import { Router } from "express";
import { clerkWebhook } from "../controller/auth.controller.js";
import bodyParser from 'body-parser';

const authRouter = Router();

authRouter.get('/', (req, res) => {
  res.send('Auth route');
});

// ✅ Attach bodyParser.raw ONLY for /clerk POST!
authRouter.post('/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhook);

export default authRouter;
