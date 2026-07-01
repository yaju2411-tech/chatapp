import { acceptFriendRequest, getFriends, getPendingRequests, rejectFriendRequest, removeFriends, sendFriendRequest } from "@/service/chatApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export const useSendFriendRequest = () => {
    return useMutation({
        mutationFn: sendFriendRequest
    });
}

export const usePendingRequests = () => {
    return useQuery({
        queryKey:["pendingRequests"],
        queryFn:getPendingRequests
    });
};

export const useAcceptFriendRequest = ()=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:acceptFriendRequest,
        onSuccess:()=>{
            queryClient.invalidateQueries({
                queryKey:["pendingRequests"]
            });
            queryClient.invalidateQueries({
                queryKey:["friends"]
            });
            queryClient.invalidateQueries({
                queryKey:["conversations"]
            });
            toast.success("You are now Friends",{position:"top-center"});
        }
    });
};

export const useRejectFriendRequest = ()=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:rejectFriendRequest,
        onSuccess:()=>{
            queryClient.invalidateQueries({
                queryKey:["pendingRequests"]
            });
        }
    });
};

export const useGetFriends = (search: string) => {
    return useQuery({
        queryKey: ["friends", search],
        queryFn: () => getFriends(search)
    });
};

export const useRemoveFriends = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:removeFriends,
        onSuccess:()=>{
            queryClient.invalidateQueries({
                queryKey:["friends"]
            });
            queryClient.invalidateQueries({
                queryKey:["conversations"]
            });
            toast.success("Friend Remove",{position:"top-center"});
        }
    });
}
