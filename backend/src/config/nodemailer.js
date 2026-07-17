import dotenv from "dotenv";
import nodemailer from "nodemailer";
import dns from "dns";

dotenv.config();

// Custom lookup function that forces IPv4 resolution only (resolves production ENETUNREACH IPv6 issues on Render)
const lookupIPv4 = (hostname, options, callback) => {
    return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

const smtpPort = parseInt(process.env.SMTP_PORT || "465");
const isSecure = process.env.SMTP_SECURE 
    ? process.env.SMTP_SECURE === "true" 
    : smtpPort === 465;

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: isSecure,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
    lookup: lookupIPv4
});

export const getMailSender = () => {
    return process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "onboarding@resend.dev";
};

transporter.verify((err, success) => {
    if (err) {
        console.error("SMTP Error:", err);
    } else {
        console.log("SMTP Ready");
    }
});