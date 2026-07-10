import { friendEmmiter } from "../emitter/friendEmitter.js";
import { transporter } from "../config/nodemailer.js";

friendEmmiter.on("friend-request",async(sender,receiver)=>{
    try{
        await transporter.sendMail({
            from: `"Chat App" <${process.env.EMAIL_USER}>`,
            to: receiver.email,
            subject:"New Friend Request",
            html:`<h2>You have a new firend request from ${sender.name}</h2>
            <p>Open the app to accept and reject</p>`,
        });
    }
    catch(err){
        console.log(err.message);
    }
});

friendEmmiter.on("friend-accepted",async(receiver,sender)=>{
    try{
        await transporter.sendMail({
            from: `"Chat App" <${process.env.EMAIL_USER}>`,
            to: receiver.email,
            subject:"Friend Request Accepted",
            html:`
                <h2>${receiver.name} accepted your friend request.</h2>
                <p>You can now chat together.</p>`
        });
    }catch(err){
        console.log(err.message);
    }
});

friendEmmiter.on("friend-rejected",async(receiver,sender)=>{
    try{
        await transporter.sendMail({
            from: `"Chat App" <${process.env.EMAIL_USER}>`,
            to: receiver.email,
            subject:"Friend Request Rejected",
            html:`<h2>${receiver.name} rejected your friend request.</h2>`
        });
    }catch(err){
        console.log(err.message);
    }
});

friendEmmiter.on("friend-removed", async (sender, receiver) => {
    try {
        await transporter.sendMail({
            from: `"Chat App" <${process.env.EMAIL_USER}>`,
            to: receiver.email,
            subject: "Friend Removed",
            html: `
                <h2>${sender.name} removed you from friends.</h2>
            `
        });
    }
    catch (err) {
        console.log(err);
    }
});




