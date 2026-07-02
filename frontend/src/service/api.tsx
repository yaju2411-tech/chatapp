import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL:`${API_URL}/api`
});
// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
//error interceptor
api.interceptors.response.use(
    (response)=>response,
    (error)=>{
        toast.error(
            error.response?.data?.message ||
            error.message ||
            "Something went wrong"
        );

        return Promise.reject(error);
    }
);