import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';
import authRouter from './routes/auth.routes.js';
import connectToDatabase from './database/mongodb.js';
import { clerkWebhook } from './controller/auth.controller.js';
import bodyParser from 'body-parser';
import adRouter from './routes/ad.routes.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'svix-id', 'svix-timestamp', 'svix-signature']
}));


app.post(
  '/api/v1/auth/clerk',
  bodyParser.raw({ type: 'application/json' }), clerkWebhook
);

// ✅ Normal JSON for other routes
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Adwise!');
});

// ✅ This includes the raw POST only on /clerk
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/ad', adRouter);

app.listen(PORT, async () => {
  console.log(`Server running on PORT ${PORT}`);
  await connectToDatabase();
});
