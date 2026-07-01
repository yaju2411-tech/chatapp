import { Notification } from "../../models/Notifications.js";

export const getNotifications = async(req,res) => {
    try{
        const notifications = await Notification.find({
            receiver: req.user.id
        }).populate("sender", "name avatar").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            notifications
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}

export const markAsRead = async(req,res) => {
    try{
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }
        notification.isRead = true;
        await notification.save();
        return res.status(200).json({
            success: true,
            notification
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}

export const markAllAsRead = async(req,res) => {
    try{
        await Notification.updateMany(
            {
                receiver: req.user.id,
                isRead: false
            },
            {
                isRead: true
            }
        );
        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}

export const deleteNotification = async(req,res) => {
    try{
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }
        await notification.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Notification deleted"
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}

export const clearAllNotification = async(req,res) => {
    try{
        await Notification.deleteMany({
            receiver: req.user.id
        });
        return res.status(200).json({
            success: true,
            message: "All notifications deleted"
        });        
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}