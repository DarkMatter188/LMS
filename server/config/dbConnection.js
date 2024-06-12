// const mongoose = require('mongoose');
import mongoose from "mongoose";

mongoose.set('strictQuery',false);
const connectToDB = async ()=>{
    try{
        const {connection} = await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/LearningManagementSystem'
        );
        if(connection){
            console.log(`Connected to MongoDB :  ${connection.host}`)
        }
    }catch(e){
        console.log(e);
        process.exit(1);
    }
}

// module.exports = connectToDB;
export default connectToDB;