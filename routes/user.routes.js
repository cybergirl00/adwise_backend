import { Router } from "express";
import { completeProfile } from "../controller/user.controller.js";

const userRouter = Router();

userRouter.get('/', (req, res) => {
  res.send('User route');
});


userRouter.post('/updateProfile', completeProfile)

export default userRouter;
