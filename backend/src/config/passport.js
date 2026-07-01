import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";

console.log(process.env.GOOGLE_CLIENT_ID);
console.log(process.env.GOOGLE_CLIENT_SECRET);

passport.use(
    new GoogleStrategy({
        clientID:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:"http://localhost:3000/api/auth/google/callback",
    },async(accessToken,refreshToken,profile,done)=>{
        try{
            let user = await User.findOne({
                email : profile.emails[0].value,
            });
            if (user && user.provider === "local") {
                return done(null,false,{ message: "This email is already registered with password login." });
            }
            if(!user){
                user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId:profile.id,
                provider:"google",
                isVerified:true,
                avatar:profile.photos?.[0]?.value || "",
                });
            }
            else{
                user.avatar = profile.photos?.[0]?.value || user.avatar;
                await user.save();
            }
            done(null,user);
        }catch(err){
            done(err,null);
        }
    }),
);

passport.serializeUser((user,done)=>{
    done(null,user.id);
});

passport.deserializeUser(async(id,done)=>{
    const user = await User.findById(id);
    done(null,user);
})

export default passport;