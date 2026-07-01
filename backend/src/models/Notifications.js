import mongoose from "mongoose"

const NotificationSchema = mongoose.Schema({
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    },
    type:{
        type:String,
        enum:["friend_request","friend_removed","friend_accept","friend_reject","message","group_invite","call","missed_call","new_message"],
        required:true,
    },
    text:{
        type:String,
        required:true,
    },
    conversation:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation",
        default:null,
    },
    message:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Message",
        default:null,
    },
    isRead:{
        type:Boolean,
        default:false,
    }
},{
    timestamps:true
});

export const Notification = mongoose.model("Notifications",NotificationSchema);