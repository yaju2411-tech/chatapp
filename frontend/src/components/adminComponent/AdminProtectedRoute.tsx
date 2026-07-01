import { useProfile } from "@/hooks/authHook/useProfileHook";
import { socket } from "@/socket/socket";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export const AdminRoute = ({children}:{children:React.ReactNode})=>{
    const {data,isLoading}=useProfile();
    useEffect(() => {
    if(data?.user._id)
        {socket.emit("setup",data?.user._id);}
    },[data]);
    if(isLoading)
        return <>Loading...</>;
    if(
        data?.user.role !== "admin" &&
        data?.user.role !== "superadmin"
    ){
        return <Navigate to="/" />;
    }

    return children;
};

