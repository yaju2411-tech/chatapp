import { useAuth } from "@/hooks/authHook/useLoginSignup";
import type React from "react";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({children}:{children : React.ReactNode}) => {
    const {isLoading,isError} = useAuth();
    if(isLoading){
        return <h1>Loading...</h1>
    }
    if(isError){
        return <Navigate to={"/login"}/>
    }
    return children;
}