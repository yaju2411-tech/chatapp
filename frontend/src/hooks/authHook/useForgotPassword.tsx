import { useMutation } from "@tanstack/react-query";
import {sendResetOtp,verifyResetOtp,resendResetOtp,changePassword} from "../../service/authServiceApi";
export const useForgotPassword = () => {
    const sendOtpMutation = useMutation({mutationFn:sendResetOtp});
    const verifyOtpMutation = useMutation({mutationFn: ({email,otp}: {email: string;otp: string;}) => verifyResetOtp(email, otp)});
    const resendOtpMutation = useMutation({mutationFn: resendResetOtp});
    const changePasswordMutation = useMutation({mutationFn:({email,password}:{email:string,password:string}) => changePassword(email,password)});
    return{sendOtpMutation,verifyOtpMutation,resendOtpMutation,changePasswordMutation}
};