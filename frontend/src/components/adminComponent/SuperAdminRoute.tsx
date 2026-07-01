import { useProfile } from "@/hooks/authHook/useProfileHook";
import { socket } from "@/socket/socket";
import type React from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export const SuperAdminRoute = ({children}:{children:React.ReactNode})=>{
    const {data,isLoading}=useProfile();
    useEffect(() => {
        if(data?.user._id)
            {socket.emit("setup",data?.user._id);}
    },[data]);
    if(isLoading)
        return <>Loading...</>;
    if(
        data?.user.role !== "superadmin"
    ){
        return <Navigate to="/" />;
    }
    return children;
};

