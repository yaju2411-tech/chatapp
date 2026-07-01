import { toast } from "sonner";
import { api } from "../../service/api";
import { useNavigate } from "react-router-dom";
export const useVerifyOtp = () => {
    const navigate = useNavigate();
    const verifyOtp = async (otp: string) => {
        try {
            const email = localStorage.getItem("email");
            if (!email) return toast.error("email not found");
            if (otp.length !== 6) return toast.error("Enter complete OTP");
            const response = await api.post("/auth/verify-otp",
                {email,otp}
            );
            console.log(response.data);
            localStorage.removeItem("email");
            navigate("/login");
        }
        catch (err) {
            console.log(err);
        }
    };
    const resendOtp = async () => {
        try {
            const email = localStorage.getItem("email");
            await api.post("/auth/resend-otp",{email});
            alert("OTP sent");
        }
        catch (err) {
            console.log(err);
        }
    };
    return {verifyOtp,resendOtp
    };
};