import {sendMessage,getMessages,markMessageSeen,deleteMessage, clearChat, deleteManyMessages, uploadMediaMessage, forwardMessages} from "@/service/chatApi";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";

const queryKey = ["messages"];

export const useGetMessages = (conversationId: string) => {
  return useQuery({
    queryKey: [...queryKey, conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId]
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations"]
      });
    }
  });
};

export const useMarkMessageSeen = () => {
  return useMutation({
    mutationFn: markMessageSeen,
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"]
      });
    }
  });
};

export const useClearChat = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: clearChat,
        onSuccess: (_, conversationId) => {
            queryClient.invalidateQueries({
                queryKey: ["messages", conversationId]
            });
            queryClient.invalidateQueries({
                queryKey: ["conversations"]
            });
        }
    });
};

export const useDeleteManyMessages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteManyMessages,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
};

export const useUploadMedia = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({conversationId,file,}: {conversationId: string;file: File;}) =>
        uploadMediaMessage(conversationId, file),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: ["messages", variables.conversationId],
          });
          queryClient.invalidateQueries({
            queryKey: ["conversations"],
          });
        },
    });
};

export const useForwardMessages = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: forwardMessages,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey:["messages"]
            });
            queryClient.invalidateQueries({
                queryKey:["conversations"]
            });
        }
    });
};