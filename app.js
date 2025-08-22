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
import walletRouter from './routes/wallet.route.js';
import campaignRouter from './routes/campaign.routes.js';
import userRouter from './routes/user.routes.js';
import messageRouter from './routes/messages.routes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Message from './models/message.model.js';
import appRouter from './routes/app.routes.js';

const app = express();
app.use(express.json());


app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'svix-id', 'svix-timestamp', 'svix-signature', 'x-api-key'],
  credentials: true,
  optionsSuccessStatus: 200
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store typing users
const typingUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join user to their own room (using clerkId)
  socket.on('join', (clerkId) => {
    socket.join(clerkId);
    console.log(`User ${clerkId} joined their room`);
  });

  // Handle typing indicator
  socket.on('typing', ({ senderId, recieverId, isTyping }) => {
    if (isTyping) {
      typingUsers.set(senderId, recieverId);
    } else {
      typingUsers.delete(senderId);
    }
    socket.to(recieverId).emit('typing', { senderId, isTyping });
  });

  // Handle new messages
socket.on('newMessage', async (message) => {
  try {
    // Validate required fields
    if (!message.content || !message.senderId || !message.recieverId) {
      throw new Error('Missing required message fields');
    }

    const savedMessage = await Message.create({
      content: message.content,
      senderId: message.senderId,
      recieverId: message.recieverId, // Ensure correct spelling
      type: 1
    });
    
    io.to(message.senderId).emit('messageReceived', savedMessage);
    io.to(message.recieverId).emit('messageReceived', savedMessage);
    
  } catch (error) {
    console.error('Error handling message:', error);
    // Optionally notify the sender about the error
    socket.emit('messageError', {
      error: 'Failed to send message',
      details: error.message
    });
  }
});

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up typing indicators
    for (const [userId, recieverId] of typingUsers.entries()) {
      if (socket.id === userId) {
        socket.to(recieverId).emit('typing', { senderId: userId, isTyping: false });
        typingUsers.delete(userId);
      }
    }
  });
});

// Middlewares
app.post(
  '/api/v1/auth/clerk',
  bodyParser.raw({ type: 'application/json' }), clerkWebhook
);

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Adwise!');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/ad', adRouter);
app.use('/api/v1/wallet', walletRouter);
app.use('/api/v1/campaign', campaignRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/app', appRouter)

// Start the server
const startServer = async () => {
  await connectToDatabase();
  httpServer.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
  });
};

startServer();