import { api } from "./api";

//friend api
export const sendFriendRequest = async (id:string) => {
    const response = await api.post(`/friends/request/${id}`);
    return response.data;
}

export const getPendingRequests = async () => {
    const response = await api.get("/friends/pending");
    return response.data.requests;
};

export const acceptFriendRequest = async(id:string)=>{
    const response = await api.patch(`/friends/accept/${id}`);
    return response.data;
};

export const rejectFriendRequest = async(id:string)=>{
    const response = await api.delete(`/friends/reject/${id}`);
    return response.data;
};

export const getFriends = async (search = "") => {
    const response = await api.get(`/friends/getFriend?search=${search}`);
    return response.data;
};

export const removeFriends = async(id:string) => {
    const response = await api.delete(`/friends/remove/${id}`);
    return response.data;
}

//conversation api
export const createConversation = async (receiverId: string) => {
    const response = await api.post("/conversation/createConversation",{receiverId});
    return response.data;
};

export const getConversations = async () => {
    const response = await api.get("/conversation/getConversation");
    return response.data;
};

export const getSingleConversation = async (id:string) => {
    const response = await api.get(`/conversation/getConversation/${id}`);
    return response.data;
}

export const deleteConversation = async (id: string) => {
    const response = await api.delete(`/conversation/deleteConversation/${id}`);
    return response.data;
};

//message api
export const sendMessage = async (data: {
    conversationId: string;
    text?: string;
    image?: string;
    video?: string;
    audio?: string;
    file?: string;
    gifUrl?: string;
    messageType?: "text" | "gif" | "image" | "video" | "audio" | "file";
    replyTo?: string;
}) => {
    const response = await api.post("/message/sendMessage", data);
    return response.data;
};

export const getMessages = async (conversationId: string) => {
  const response = await api.get(`/message/${conversationId}`);
  return response.data;
};

export const markMessageSeen = async (conversationId: string) => {
  const response = await api.patch(`/message/seen/conversation/${conversationId}`);
  return response.data;
};

export const deleteMessage = async (messageId: string) => {
  const response = await api.delete(`/message/delete/${messageId}`);
  return response.data;
};

export const clearChat = async (conversationId: string) => {
    const response = await api.delete(`/message/clear/${conversationId}`);
    return response.data;
};

export const forwardMessages = async (data:{conversationIds:string[];messageIds:string[];
}) => {
    const response = await api.post("/message/forward",data);
    return response.data;
};

export const deleteManyMessages = async (data: {conversationId: string;messageIds: string[];}) => {
  const response = await api.delete("/message/deleteMany", {data});
  return response.data;
};

export const uploadMediaMessage = async(conversationId:string,file:File) => {
    const formData = new FormData();
    formData.append("file",file);
    const response = await api.post(`/message/upload/${conversationId}`,formData,{
        headers: {"Content-Type": "multipart/form-data",},
    });
    return response.data;
}

