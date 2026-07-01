import { Notification } from "../models/Notifications.js";

export const createNotification = async (
    sender,receiver,type,text,conversation = null,message = null
)=>{
    return await Notification.create({sender,receiver,type,text,conversation,message});
};