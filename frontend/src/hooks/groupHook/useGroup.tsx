import {
  createGroup,
  addMember,
  removeMember,
  makeAdmin,
  removeAdmin,
  leaveGroup,
  transferOwnership,
  updateGroupSettings,
  getGroupInfo,
  deleteGroup,
  updateGroupInfo,
  clearGroupChat,
  generateInviteLink,
  joinByInviteLink
} from "@/service/groupChatApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("Group created successfully", { position: "top-center" });
    },
  });
};

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      toast.success("Member added successfully", { position: "top-center" });
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      toast.success("Member removed successfully", { position: "top-center" });
    },
  });
};

export const useMakeGroupAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: makeAdmin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      toast.success("Member is now an Admin", { position: "top-center" });
    },
  });
};

export const useRemoveGroupAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAdmin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      toast.success("Admin role removed", { position: "top-center" });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("You left the group", { position: "top-center" });
    },
  });
};

export const useTransferGroupOwnership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transferOwnership,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      toast.success("Ownership transferred successfully", { position: "top-center" });
    },
  });
};

export const useUpdateGroupSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGroupSettings,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      toast.success("Group settings updated", { position: "top-center" });
    },
  });
};

export const useGroupInfo = (conversationId: string) => {
  return useQuery({
    queryKey: ["groupInfo", conversationId],
    queryFn: () => getGroupInfo(conversationId),
    enabled: !!conversationId,
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("Group deleted successfully", { position: "top-center" });
    },
  });
};

export const useUpdateGroupInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGroupInfo,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", variables.conversationId],
      });
      toast.success("Group info updated", { position: "top-center" });
    },
  });
};

export const useClearGroupChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearGroupChat,
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("Group chat cleared", { position: "top-center" });
    },
  });
};

export const useGenerateInviteLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateInviteLink,
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: ["groupInfo", conversationId],
      });
      toast.success("Invite link generated successfully", { position: "top-center" });
    },
  });
};

export const useJoinGroupByLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinByInviteLink,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success(data.message || "Joined group successfully", { position: "top-center" });
    },
  });
};
