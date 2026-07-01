import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import session from "express-session";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { roleMiddleware } from "../middlware/adminMiddlware.js";


const router = express.Router();

router.get("/super-dashboard",authMiddlware,roleMiddleware("superadmin"),
    (req,res)=>{
        res.json({
            success:true
        });
    }
);

export default router;