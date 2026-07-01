import { RefreshCwIcon } from "lucide-react"
import { Button } from "../components/ui/button"
import {Card,CardContent,CardDescription,CardFooter,CardHeader,CardTitle,} from "../components/ui/card"
import {Field,FieldLabel,} from "../components/ui/field"
import {InputOTP,InputOTPGroup,InputOTPSlot,} from "../components/ui/input-otp"
import { useState } from "react"
import { useVerifyOtp } from "@/hooks/authHook/useVerifyOtp"

export const VerifyByOtp = () => {
    const [value,setValue] = useState("");
    const {verifyOtp,resendOtp} = useVerifyOtp();
    return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black">
      <div className="w-full max-w-sm">
        <Card className="mx-auto max-w-md bg-zinc-900 text-white">
            <CardHeader>
                <CardTitle>Verify your login</CardTitle>
                <CardDescription>
                    Enter the verification code we sent to your email address:{" "}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Field>
                <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="otp-verification">
                    Verification code
                    </FieldLabel>
                    <Button variant="outline" size="xs" className="text-black font-semibold" onClick={()=>resendOtp}>
                    <RefreshCwIcon />
                    Resend Code
                    </Button>
                </div>
                <div className="space-y-2 flex flex-col items-center">
                    <InputOTP
                        maxLength={6}
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
                    <div className="text-center text-sm">
                        {value === "" ? (
                        <>Enter your one-time password.</>
                        ) : (
                        <>You entered: {value}</>
                        )}
                    </div>
                </div>
                </Field>
            </CardContent>
            <CardFooter className="bg-zinc-800">
                <Field>
                <Button className="w-full" onClick={()=>verifyOtp(value)}>
                    Verify
                </Button>
                <div className="text-sm text-muted-foreground">
                    Having trouble signing in?{" "}
                    <a
                    href="#"
                    className="underline underline-offset-4 transition-colors hover:text-white"
                    >
                    Contact support
                    </a>
                </div>
                </Field>
            </CardFooter>
        </Card>
    </div>
    </div>
  )
}
