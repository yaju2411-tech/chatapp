import {createConversation,deleteConversation,getConversations,getSingleConversation} from "@/service/chatApi";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import { toast } from "sonner";

export const useConversations = () => {
    return useQuery({
        queryKey: ["conversations"],
        queryFn: getConversations
    });
};

export const useCreateConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:createConversation,
        onSuccess:()=>{
            queryClient.invalidateQueries({
                queryKey:["conversations"],
            })
        }
    });
}

export const useSingleConversation = (id: string) => {
    return useQuery({
        queryKey: ["conversations", id],
        queryFn: () => getSingleConversation(id),
        enabled: !!id
    });
};

export const useDeleteConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteConversation,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["conversations"]
            });
        toast.success("Conversation Deleted",{position: "top-center"});
        }
    });
};