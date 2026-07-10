import { useGetMessages } from "@/hooks/chatHook/useMessage";
import MessageBubble from "../Message/MessageBubble";
import { useEffect, useState, useRef } from "react";
import { socket } from "@/socket/socket";
import TypingIndicator from "./TypingIndicator";
import { useMarkMessageSeen } from "@/hooks/chatHook/useMessage";
import { useQueryClient } from "@tanstack/react-query";
import DateSeparator from "./DateSeparator";

interface Props {
    conversationId: string;
    selectionMode: boolean;
    selectedMessages: string[];
    setSelectionMode: (v: boolean) => void;
    toggleMessage: (id: string) => void;
    copyTrigger: number;
    setReply: (msg: any) => void;
    bottomRef?: React.RefObject<HTMLDivElement | null>;
}

export default function MessageArea({ conversationId, selectedMessages, selectionMode, setReply,
    setSelectionMode, toggleMessage, copyTrigger, bottomRef }: Props) {
    const queryClient = useQueryClient();
    const { data, isLoading } = useGetMessages(conversationId);
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const markSeenMutation = useMarkMessageSeen();
    const prevConversationId = useRef(conversationId);

    useEffect(() => {
        if (messages.length > 0) {
            const isNewConversation = prevConversationId.current !== conversationId;
            prevConversationId.current = conversationId;

            const timer = setTimeout(() => {
                bottomRef?.current?.scrollIntoView({
                    behavior: isNewConversation ? "auto" : "smooth"
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, conversationId, bottomRef]);

    useEffect(() => {
        socket.on("user-typing", () => { setIsTyping(true); });
        socket.on("user-stop-typing", () => { setIsTyping(false); });
        return () => {
            socket.off("user-typing");
            socket.off("user-stop-typing");
        };
    }, []);
    useEffect(() => {
        if (data?.messages) {
            setMessages(data.messages);
        }
    }, [data]);
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (String(message.conversation) === String(conversationId)) {
                setMessages(prev => [...prev, message]);
            }
            markSeenMutation.mutate(conversationId);
            socket.emit("seen-message", { conversationId });
        };
        socket.on("new-message", handleMessage);
        return () => {
            socket.off("new-message", handleMessage);
        };
    }, [conversationId]);
    useEffect(() => {
        const handleSeen = () => {
            queryClient.invalidateQueries({
                queryKey: ["messages", conversationId]
            });
            queryClient.invalidateQueries({
                queryKey: ["conversations"]
            });
        };
        socket.on("messages-seen", handleSeen);
        return () => {
            socket.off("messages-seen", handleSeen);
        };
    }, [conversationId]);
    useEffect(() => {
        const handleDeleteMany = ({ conversationId: roomId, messageIds, }: any) => {
            if (roomId !== conversationId) return;
            setMessages((prev: any) => prev.map((msg: any) =>
                messageIds.includes(msg._id) ? {
                    ...msg, isDeleted: true, text: "This message was deleted",
                } : msg)
            );
        };
        socket.on("messages-deleted", handleDeleteMany);
        return () => { socket.off("messages-deleted", handleDeleteMany); };
    }, [conversationId]);
    useEffect(() => {
        if (copyTrigger === 0) return;
        const copyText = messages.filter(msg => selectedMessages.includes(msg._id))
            .filter(msg => msg.messageType === "text")
            .map(msg => msg.text).join("\n");
        navigator.clipboard.writeText(copyText);
    }, [copyTrigger]);

    if (isLoading) {
        return (<div className="flex-1 flex items-center justify-center">Loading...</div>);
    }
    return (
        <>
            <div className="p-5">
                {messages.map((message, index) => {
                    const previous = messages[index - 1];
                    const currentDay = new Date(message.createdAt).toDateString();
                    const previousDay = previous && new Date(previous.createdAt).toDateString();
                    const showDate = !previous || currentDay !== previousDay;
                    return (
                        <div key={message._id}>
                            {showDate &&
                                <DateSeparator date={message.createdAt} />
                            }
                            <MessageBubble key={message._id} message={message} setReply={setReply}
                                selectionMode={selectionMode} selectedMessages={selectedMessages}
                                setSelectionMode={setSelectionMode} toggleMessage={toggleMessage} />
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="px-4 py-2">
                        <TypingIndicator />
                    </div>
                )}
            </div>
        </>
    );
}