import mongoose from "mongoose" 

const ConversationSchema = mongoose.Schema({
    members:[{
        type : mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    isGroup:{
        type:Boolean,
        default:false,
    },
    groupName:{
        type:String,
        default:null,
    },
    groupAvatar:{
        type:String,
        default:null,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unreadCounts:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        count:{
            type:Number,
            default:0
        }
    }],
},{
    timestamps:true
});

export const Conversation = mongoose.model("Conversation",ConversationSchema);