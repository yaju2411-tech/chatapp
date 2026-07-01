import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import session from "express-session";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { roleMiddleware } from "../middlware/adminMiddlware.js";

const router = express.Router();

//admin route with midleware
router.get("/dashboard",authMiddlware,roleMiddleware("admin","superadmin"),
    (req,res)=>{
        res.json({
            success:true,
            message:"Admin dashboard"
        });
    }
);

router.post("/create-admin",authMiddlware,roleMiddleware("superadmin"));

export default router;