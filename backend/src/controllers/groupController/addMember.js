import { Conversation } from "../../models/Conversation.js";
import { User } from "../../models/User.js";

export const addMember = async(req,res) => {
    try{
        const { memberId } = req.body;
        const conversation = req.conversation;
        //check admin
        const userId = req.user.id;
        const isAdmin = conversation.admins.some(
            admin => admin.toString() === userId
        );
        if (conversation.groupSettings.onlyAdminsCanAddMembers && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only admins can add members."
            });
        }
        //check member
        if(!memberId){
            res.status(400).json({
                success:false,
                message:"member id required"
            });
        }
        //make sure of group
        if(!conversation.isGroup){
            res.status(400).json({
                success:false,
                message:"this is not a group"
            });
        }
        //check user exist
        const user = await User.findById(memberId);
        if(!user){
            res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        //check already exists
        const alreadyMember = conversation.members.some(
            member => member.toString() === memberId,
        );
        if(alreadyMember){
            res.status(400).json({
                success:false,
                message:"Already a member of group",
            });
        }
        //add member
        conversation.members.push(memberId);
        //initialize Count
        conversation.unreadCounts.push({
            user:memberId,
            count:0,
        });
        await conversation.save();
        const updateConversation = await Conversation.findById(conversation._id)
                                    .populate("members","name avatar isOnline lastSeen")
                                    .populate("createdBy","name avatar")
                                    .populate("admins","name avatar");
        return res.status(200).json({
            success:true,
            message:"Member added succesfully",
            conversation:updateConversation,
        });
    }
    catch(err){
        console.error("add group error",err);
        res.status(400).json({
            success:false,
            message:"add to group failed"
        });
    }
};