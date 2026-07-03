import express from "express";
import { login, signup } from "../controllers/userController/authController.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { resendOtp } from "../controllers/userController/ResendOtpController.js";
import { forgotPasswordController } from "../controllers/userController/forgotPasswordController.js";
import { VerifyOtp } from "../controllers/userController/VerifyOtpController.js";
import { verifyResetOtp } from "../controllers/userController/verifyReset.js";
import { changePassword } from "../controllers/userController/changePassword.js";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { getProfile } from "../controllers/userController/userController.js";
import { updateProfile } from "../controllers/userController/updateProfileController.js";
import { roleMiddleware } from "../middlware/adminMiddlware.js";
import { searchUser } from "../controllers/userController/searchUserController.js";

const router = express.Router();
const API_URL = process.env.NODE_ENV === "production" ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL;

//auth routers
router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp",VerifyOtp);
router.post("/resend-otp",resendOtp);
router.post("/forgot-password",forgotPasswordController);
router.post("/verify-reset-otp",verifyResetOtp);
router.post("/change-password",changePassword);
//request for google
router.get("/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);
//fail or success 
router.get("/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login"
    }),
    (req, res) => {
        const token = jwt.sign({
            id: req.user._id
        },process.env.JWT_SECRET,{
            expiresIn: "1d"
        }
    );
    res.redirect(`${API_URL}/auth-success?token=${token}`);
});

//middlware for verify jwt token
router.get("/me",authMiddlware,(req,res)=>{
    res.status(200).json({
        success:true,
        user:req.user
    })
});

//router for get, update and delete user using middlware
router.get("/search", authMiddlware, searchUser);
router.get("/profile",authMiddlware,getProfile);
router.patch("/profile",authMiddlware,updateProfile);

export default router;