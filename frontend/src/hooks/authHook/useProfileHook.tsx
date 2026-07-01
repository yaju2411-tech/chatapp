import { getProfile, searchUser, updateProfile } from "../../service/authServiceApi";
import {useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useProfile = () => {
    return useQuery({
        queryKey:["profile"],
        queryFn:getProfile
    });
}

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:({name,avatar}:{name:string;avatar?:string;}) => updateProfile(name, avatar),
        onSuccess:()=>{
            queryClient.invalidateQueries({
                queryKey:["profile"],
            });
        }
    });
}

export const useSearchUser = () => {
    return useMutation({
        mutationFn: searchUser
    });
};