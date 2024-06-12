// const app = require('./app')
import connectToDB from './config/dbConnection.js';
import app from './app.js'
import cloudinary from 'cloudinary'
import cors from 'cors'
import { config } from 'dotenv';
import Razorpay from 'razorpay';
config();
app.use(cors());
const PORT = process.env.PORT || 5002;

cloudinary.v2.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_secret : process.env.CLOUDINARY_API_SECRET,
    api_key : process.env.CLOUDINARY_API_KEY
});

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });

app.listen(PORT,async ()=>{
    await connectToDB();
    console.log(`App running on http://localhost:${PORT}`)

})

