import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    googleId: {
        type: String,
        default: null
    },
    password:{
        type:String,
        default:null,
    },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    isVerified:{
        type:Boolean,
        default:false
    },
    otp:{
        type:String,
        default:null,
    },
    otpExpire:{
        type:Date,
        default:null,
    },
    role: {
        type: String,
        enum: ["user", "admin", "superadmin"],
        default: "user"
    },
    avatar: {
        type: String,
        default: ""
    },
    isOnline:{
        type:Boolean,
        default:false
    },
    lastSeen:{
        type:Date,
        default:null
    },
    },{
    timestamps : true,
});

export const User = mongoose.model("User",UserSchema);