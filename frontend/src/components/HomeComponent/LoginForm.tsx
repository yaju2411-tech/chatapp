import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { useGoogleLogin, useLogin } from "@/hooks/authHook/useLoginSignup"


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const loginMutation = useLogin();
  const  handleGoogleLogin  = useGoogleLogin();
  const handleLogin = (e:any) => {
    e.preventDefault();
    loginMutation.mutate({email,password},{
      onSuccess:(data)=>{
        localStorage.setItem("token",data.token);
        navigate("/home");
    }});
  };
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black">
      <div className="w-full max-w-sm">
        <div {...props} className="flex flex-col gap-6">
          <Card className="bg-zinc-800 text-white font-semibold">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email" value={email} onChange={(e)=>{setEmail(e.target.value)}}
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="forgotPassword"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input id="password" type="password" value={password} onChange={(e)=>{setPassword(e.target.value)}} required />
                  </Field>
                  <Field>
                    <Button type="submit">Login</Button>
                    <Button variant="outline" type="button" className="text-white font-semibold" onClick={handleGoogleLogin}>
                      Login with Google
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account? <a href="/signUp">Sign up</a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
