import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";
import jwt from "jsonwebtoken";
import { transporter, getMailSender } from "../../config/nodemailer.js";


export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        //if email exist
        const exist = await User.findOne({ email });
        if (exist) {
            if (exist.provider === "google") {
                return res.status(400).json({
                    success: false,
                    message: "This email is registered with Google. Please sign in using Google."
                });
            }
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        //hash password
        const hashPassword = await bcrypt.hash(password, 10);
        //otp for verify
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name, email, password: hashPassword,
            otp, otpExpire: Date.now() + 5 * 60 * 1000,
        });
        await transporter.sendMail({
            from: `"Chat App" <${getMailSender()}>`,
            to: email,
            subject: "Email Verification OTP",
            html: `
                <h2>Your OTP is:</h2>
                <h1>${otp}</h1>
                <p>Valid for 5 minutes.</p>`
        });
        res.status(201).json({
            success: true,
            message: "OTP sent successfully"
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found"
            });
        }
        if (user.provider === "google") {
            return res.status(400).send({ message: "Please login using Google." });
        }
        //compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Password"
            });
        }
        //generate token
        const token = jwt.sign(
            {
                id: user._id,
            }, process.env.JWT_SECRET, {
            expiresIn: "1d"
        }
        );
        res.status(200).json({
            success: true,
            token
        });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}
