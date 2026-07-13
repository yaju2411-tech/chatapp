import mongoose from "mongoose" 

const ConversationSchema = mongoose.Schema({
    members:[{
        type : mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
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
    //group related schema 
    isGroup:{
        type:Boolean,
        default:false
    },
    groupName:{
        type:String,
        default:null
    },
    groupAvatar:{
        type:String,
        default:null
    },
    description:{
        type:String,
        default:""
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    admins:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    groupSettings: {
        onlyAdminsCanEditInfo: {
            type: Boolean,
            default: true
        },
        onlyAdminsCanAddMembers: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanRemoveMembers: {
            type: Boolean,
            default: true
        },
        onlyAdminsCanSendMessages: {
            type: Boolean,
            default: false
        }
    },
    inviteLink:{
        type:String,
        default:null
    },
},{
    timestamps:true
});

export const Conversation = mongoose.model("Conversation",ConversationSchema);