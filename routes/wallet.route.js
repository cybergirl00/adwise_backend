import { Router } from "express";
import { fundWallet, getUserTransactions } from "../controller/wallet.controller.js";

const walletRouter = Router();

walletRouter.get('/', (req, res) => {
  res.send('Ad route');
});

walletRouter.post('/fund', fundWallet)
walletRouter.get('/:clerkId', getUserTransactions)

export default walletRouter;
