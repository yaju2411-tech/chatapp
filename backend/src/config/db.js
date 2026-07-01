import mongoose from "mongoose";

export const connectDB = async() => {
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/authDB");
        console.log("MongoDb connected");
    }
    catch(err){
        console.log(err.message);
    }
}