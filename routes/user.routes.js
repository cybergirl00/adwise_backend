import { Router } from "express";
import { completeProfile, getAppData, getCreatorbyId, getCreators, getUserbyClerkId } from "../controller/user.controller.js";

const userRouter = Router();

userRouter.get('/', (req, res) => {
  res.send('User route');
});


userRouter.post('/updateProfile', completeProfile)
userRouter.get('/getuserbyclerkId/:clerkId', getUserbyClerkId);
userRouter.get('/creators', getCreators);
userRouter.get('/creators/:id', getCreatorbyId);

userRouter.get('/userdata/:clerkId', getAppData)

export default userRouter;
