import express from 'express'
import { PORT } from './config/env.js';
import authRouter from './routes/auth.routes.js';
import connectToDatabase from './database/mongodb.js';

const app = express();

app.get('/', (req, res) => {
    res.send('Welcome to Adwise!, Alternative to ADsense');
});


app.use('/api/v1/auth', authRouter);


app.listen(PORT, async () => {
    console.log(`Server running on PORT ${PORT}`)
   await  connectToDatabase();
})