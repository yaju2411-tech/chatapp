import mongoose from "mongoose";

const MessageSchema = mongoose.Schema({
    conversation:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation",
        required:true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String,
        default:""
    },
    image:{
        type:String,
        default:""
    },
    video:{
        type:String,
        default:"",
    },
    audio:{
        type:String,
        default:"",
    },
    file:{
        type:String,
        default:"",
    },
    messageType:{
        type:String,
        enum:["text","video","audio","image","file","gif"],
        default:"text",
    },
    gifUrl:{
        type:String,
        default:"",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    lastSeenBy:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        seenAt:Date
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
},{
    timestamps:true
}); 

export const Message = mongoose.model("Message",MessageSchema);