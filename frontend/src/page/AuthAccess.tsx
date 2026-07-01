import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"

export const AuthSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    useEffect(()=>{
        const token = searchParams.get("token");
        if(token){
            localStorage.setItem("token", token);
            navigate("/home");
        }
    },[]);
    return <h1>Loading...</h1>;
}