import { api } from "./api"

//auth profile creation with verify
const API_URL = import.meta.env.VITE_API_URL;

export const sendResetOtp = async(email:string) => {
    const response = await api.post("/auth/forgot-password",{email});
    return response.data;
}

export const verifyResetOtp = async(email:string,otp:string) => {
    const response = await api.post("/auth/verify-reset-otp",{email,otp});
    return response.data;
}
export const resendResetOtp = async (email: string) => {
    const response = await api.post("/auth/forgot-password",{ email });
    return response.data;
};

export const changePassword = async (email: string,password: string) => {
    const response = await api.post("/auth/change-password",{email,password})
    return response.data;
}

export const loginUser = async(email:string,password:string) => {
    const response = await api.post("/auth/login",{email,password});
    return response.data;
}

export const signupUser = async(name:string,email:string,password:string) => {
    const response = await api.post("/auth/signup",{name,email,password});
    return response.data;
}

export const googleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
}

//auth session url
export const getCurrentUSer = async() => {
    const response = await api.get("/auth/me");
    return response.data;
}

//user profile find and update
export const getProfile = async() => {
    const response = await api.get("/auth/profile");
    return response.data;
}

export const updateProfile = async(name:string,avatar?:string) => {
    const response = await api.patch("/auth/profile",{name,avatar});
    return response.data;
}

export const searchUser = async (email:string) => {
    const response = await api.get(`/auth/search?email=${email}`);
    return response.data;
};