import { Conversation } from "../../models/Conversation.js";

export const createGroup = async(req,res) => {
    try{
        const { groupName,members,groupAvatar="",description=""} = req.body;
        const userId = req.user.id;
        //validate group name
        if(!groupName?.trim()){
            return res.status(400).json({
                success:false,
                message:"Group name is required"
            });
        }
        //validate members
        if(!Array.isArray(members)){
            return res.status(400).json({
                success:false,
                message:"Members must be an array"
            });
        }
        if(members.length < 1){
            return res.status(400).json({
                success:false,
                message:"at least one member required"
            });
        }
        //remove duplicate and add creater
        const uniqueMembers = [
            ...new Set([
                ...members.map(id => id.toString()),
                userId.toString(),
            ])
        ];
        //create unread counts for message notification
        const unreadCounts = uniqueMembers.map(member => ({
            user : member,
            count : 0
        }));
        const conversation = await Conversation.create({
            isGroup: true,
            groupName: groupName.trim(),
            groupAvatar,
            description,
            unreadCounts,
            createdBy: userId,
            admins: [userId],
            members: uniqueMembers,
            groupSettings: {
                onlyAdminsCanEditInfo: true,
                onlyAdminsCanAddMembers: false,
                onlyAdminsCanRemoveMembers: true,
                onlyAdminsCanSendMessages: false,
            }
        });
        const populatedConversation = await Conversation.findById(conversation._id)
           .populate("members", "name avatar isOnline lastSeen")
           .populate("createdBy", "name avatar")
           .populate("admins", "name avatar");
        return res.status(201).json({
            success: true,
            message: "Group created successfully.",
            conversation: populatedConversation
        });
    } catch (error) {
        console.error("Create Group Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    };
}