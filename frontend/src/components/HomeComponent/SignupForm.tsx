import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin, useSignUp } from "@/hooks/authHook/useLoginSignup";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const navigate = useNavigate();
  const signupMutation = useSignUp();
  const  handleGoogleLogin  = useGoogleLogin();
  const handleSubmit = (e:any) => {
      e.preventDefault();
      signupMutation.mutate({name,email,password},{
        onSuccess:()=>{
          localStorage.setItem("email",email);
          navigate("/verify-otp");
    }});
  };
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black">
      <div className="w-full max-w-sm">
        <Card {...props} className="bg-zinc-800 text-white font-semibold">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input id="name" type="text" placeholder="John Doe"
                  value={name} onChange={(e)=>{setName(e.target.value);}} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email" value={email} onChange={(e)=>{setEmail(e.target.value);}}
                    placeholder="m@example.com"
                    required
                  />
                  <FieldDescription>
                    We&apos;ll use this to contact you. We will not share your email
                    with anyone else.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input id="password" type="password" 
                  value={password} onChange={(e)=>{setPassword(e.target.value);}} required />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
                <FieldGroup>
                  <Field>
                    <Button type="submit">Create Account</Button>
                    <Button variant="outline" type="button" className="text-white" onClick={handleGoogleLogin}>
                      Sign up with Google
                    </Button>
                    <FieldDescription className="px-6 text-center">
                      Already have an account? <a href="/login">Sign in</a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
