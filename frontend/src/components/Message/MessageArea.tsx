import { useGetMessages } from "@/hooks/chatHook/useMessage";
import MessageBubble from "../Message/MessageBubble";
import { useEffect, useState } from "react";
import { socket } from "@/socket/socket";
import TypingIndicator from "./TypingIndicator";
import { useMarkMessageSeen } from "@/hooks/chatHook/useMessage";
import { useQueryClient } from "@tanstack/react-query";

interface Props{
    conversationId:string;
    selectionMode:boolean;
    selectedMessages:string[];
    setSelectionMode:(v:boolean)=>void;
    toggleMessage:(id:string)=>void;
}

export default function MessageArea({conversationId,selectedMessages,selectionMode,setSelectionMode,toggleMessage}:Props){
    const queryClient = useQueryClient();
    const {data,isLoading} = useGetMessages(conversationId);
    const [messages,setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const markSeenMutation = useMarkMessageSeen();
    
    useEffect(() => {
        socket.on("user-typing", () => {setIsTyping(true);});
        socket.on("user-stop-typing", () => {setIsTyping(false);});
        return () => {
            socket.off("user-typing");
            socket.off("user-stop-typing");
        };
    }, []);
    useEffect(() => {
        if(data?.messages){
            setMessages(data.messages);
        }
    }, [data]);
    useEffect(() => {
        const handleMessage = (message:any) => {
            if(String(message.conversation) === String(conversationId)){
                setMessages(prev => [...prev,message]);
            }
            markSeenMutation.mutate(conversationId);
            socket.emit("seen-message",{conversationId});
        };
        socket.on("new-message",handleMessage);
        return () => {
            socket.off("new-message",handleMessage);
        };
    }, [conversationId]);
    useEffect(() => {
        const handleSeen = () => {
            queryClient.invalidateQueries({
                queryKey: ["messages", conversationId]
            });
            queryClient.invalidateQueries({
                queryKey:["conversations"]
            });
        };
        socket.on("messages-seen", handleSeen);
        return () => {
            socket.off("messages-seen", handleSeen);
        };
    }, [conversationId]);
    useEffect(() => {
        const handleDeleteMany = ({conversationId: roomId,messageIds,}: any) => {
        if (roomId !== conversationId) return;
            setMessages((prev: any) => prev.map((msg: any) =>
                messageIds.includes(msg._id) ? {
                    ...msg,isDeleted: true,text: "This message was deleted",
                }: msg)
            );
        };
        socket.on("messages-deleted", handleDeleteMany);
        return () => {socket.off("messages-deleted", handleDeleteMany);};
    }, [conversationId]);
    
    if(isLoading){
        return(<div className="flex-1 flex items-center justify-center">Loading...</div>);
    }
    return(
        <>
            <div className="p-5">
                {messages?.map((message: any) => (
                    <MessageBubble key={message._id} message={message} 
                    selectionMode={selectionMode} selectedMessages={selectedMessages}
                    setSelectionMode={setSelectionMode} toggleMessage={toggleMessage}/>
                ))}
                {isTyping && (
                    <div className="px-4 py-2">
                        <TypingIndicator />
                    </div>
                )}
            </div>
        </>
    );
}