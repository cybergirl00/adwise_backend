import express from 'express';
import cors from 'cors';
import { PORT, VEO3_API_KEY } from './config/env.js';
import authRouter from './routes/auth.routes.js';
import connectToDatabase from './database/mongodb.js';
import { clerkWebhook } from './controller/auth.controller.js';
import bodyParser from 'body-parser';
import adRouter from './routes/ad.routes.js';
import Script from './models/script.model.js';
import cron from "node-cron";


const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'svix-id', 'svix-timestamp', 'svix-signature']
}));


const headers = {
  'Authorization': `Bearer ${VEO3_API_KEY}`,
  'Content-Type': 'application/json'
};

export const backgroundTask = async () => {
  try {
    // Find all scripts where a taskId exists and videoUrl is missing
    const scripts = await Script.find({ 
      "scripts.taskId": { $exists: true },
      "scripts.videoUrl": { $exists: false } 
    });

    for (const script of scripts) {
      for (const item of script.scripts) {
        if (!item.taskId || item.videoUrl) continue;

        try {
          const res = await axios.get(`https://api.veo3api.ai/api/v1/veo/status/${item.taskId}`, {
            headers,
          });

          const status = res.data?.data?.status;
          const videoUrl = res.data?.data?.videoUrl;

          if (status === "completed" && videoUrl) {
            // Update the nested script videoUrl
            await Script.updateOne(
              { _id: script._id, "scripts.taskId": item.taskId },
              { $set: { "scripts.$.videoUrl": videoUrl } }
            );
            console.log(`Updated script with video: ${videoUrl}`);
          }
        } catch (err) {
          console.error("Error checking Veo status:", err.message);
        }
      }
    }
  } catch (err) {
    console.error("Background task error:", err.message);
  }
};

// Schedule it every 2 minutes
cron.schedule("*/2 * * * *", () => {
  console.log("Running background task...");
  backgroundTask();
});

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
