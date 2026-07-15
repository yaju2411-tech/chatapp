import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

transporter.verify((err, success) => {
    if (err) {
        console.error("SMTP Error:", err);
    } else {
        console.log("SMTP Ready");
    }
});