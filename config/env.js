import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local`})


export const { PORT, NODE_ENV, DATABASE_URL, CLERK_WEBHOOK_SECRET, OPENROUTER_API_KEY, FREEPIK_API_KEY, FREEPIK_WEBHOOK_SECRET,
    VEO3_API_KEY
 } = process.env;

