import jwt from "jsonwebtoken";

export const authMiddlware = (req,res,next) => {
    try{
        const token = req.headers.authorization?.split(" ")[1];
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Unauthorized"
            });
        }
        const decode = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decode;
        next();
    }
    catch(err){
        return res.status(401).json({
            success:false,
            message:"Invalid token"
        });
    }
}