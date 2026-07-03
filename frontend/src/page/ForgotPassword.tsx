import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { Check, RefreshCwIcon} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForgotPassword } from "../hooks/authHook/useForgotPassword";
import { toast } from "sonner";

export const ForgotPassword = () => {
    const navigate = useNavigate();
    const [value,setValue] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [emailVerified,setEmailVerified] = useState(false);
    const [otpVerified,setOtpVerified] = useState(false);
    const {sendOtpMutation,verifyOtpMutation,resendOtpMutation,changePasswordMutation} = useForgotPassword();
    const handleSendOtp = async () => {
        sendOtpMutation.mutate(email,{
            onSuccess:()=>{
                setEmailVerified(true);
                toast.success("otp send to your email");
            }
        })
    };
    const handleVerifyOtp = async () => {
        verifyOtpMutation.mutate({email,otp:value},{
            onSuccess:()=>{
                setOtpVerified(true);
                toast.success("OTP verified");
            }
        });
    };
    const handleResendOtp = async () => {
        resendOtpMutation.mutate(email,{
            onSuccess:()=>{toast.success("OTP resent");}
        });
    };
    const handleChangePassword = async (e:any) => {
        e.preventDefault();
        changePasswordMutation.mutate({email,password},{
            onSuccess:()=>{navigate("/login");}
        });
    };
    return(<>
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-zinc-800 text-white font-semibold">
            <CardHeader>
              <CardTitle>Forgot Password?</CardTitle>
              <CardDescription>
                Enter email, verify by otp and change password
              </CardDescription>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <div className="flex gap-5">
                            <Input
                            id="email" type="email" value={email} onChange={(e)=>{setEmail(e.target.value)}}
                            placeholder="m@example.com" required/>
                            <Button onClick={handleSendOtp} className="hover:bg-white hover:text-black"><Check/></Button>
                        </div>
                    </Field>
                  <Field>
                <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="otp-verification">
                    Verification code
                    </FieldLabel>
                    <div className="text-center text-sm">
                        {value === "" ? (
                        <>Enter OTP</>
                        ) : (
                        <>You entered: {value}</>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <InputOTP
                        maxLength={6} className="mt-6"
                        value={value} 
                        onChange={(value) => setValue(value)}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />  
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                    <Button variant="outline" size="xs" className="text-black font-semibold" onClick={handleResendOtp} disabled={!emailVerified}>
                        <RefreshCwIcon />
                    </Button>
                    <Button
                        onClick={handleVerifyOtp}
                        >
                        Verify OTP
                    </Button>
                </div>
                </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Change Password</FieldLabel>
                    </div>
                    <Input id="password" type="password" onChange={(e)=>{setPassword(e.target.value)}} value={password} disabled={!otpVerified} required />
                  </Field>
                  <Field>
                    <Button onClick={handleChangePassword}>Change Password</Button>
                  </Field>
                </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>);
}