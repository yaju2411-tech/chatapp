import { useNavigate } from "react-router-dom";
import { getCurrentUSer, googleLogin, loginUser, signupUser } from "../../service/authServiceApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useLogin = () => {
    return useMutation({
        mutationFn: ({email,password,}: {email: string;password: string;}) => 
        loginUser(email, password)
    });
};

export const useSignUp = () => {
    return useMutation({
        mutationFn: ({name,email,password,}: {name:string,email: string;password: string;}) => 
        signupUser(name,email, password)
    });
}

export const useGoogleLogin = () => {
    const handleGoogleLogin = () => {googleLogin();}
    return handleGoogleLogin;
}

export const useAuth = () => {
    return useQuery({
        queryKey:["auth"],
        queryFn:getCurrentUSer,
        retry:false,
    });
}

export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return () => {
        localStorage.removeItem("token");
        queryClient.removeQueries({
            queryKey:["auth"]
        });
        navigate("/login");
    };
};