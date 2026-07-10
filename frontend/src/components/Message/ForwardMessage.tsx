import { useConversations } from "@/hooks/chatHook/useConversation";
import { useForwardMessages } from "@/hooks/chatHook/useMessage";
import { useProfile } from "@/hooks/authHook/useProfileHook";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    messageIds: string[];
}

export const ForwardMessage = ({ open, onClose, onSuccess, messageIds }: Props) => {
    const { data: conversations } = useConversations();
    const { data: profileData } = useProfile();
    const currentUser = profileData?.user;
    const forwardMutation = useForwardMessages();
    const [selectedChats, setSelectedChats] = useState<string[]>([]);
    const toggleChat = (id: string) => {
        setSelectedChats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }
    const handleForward = () => {
        if (!selectedChats.length) return;
        forwardMutation.mutate({
            conversationIds: selectedChats,
            messageIds,
        }, {
            onSuccess: () => {
                setSelectedChats([]);
                onClose();
                if (onSuccess) onSuccess();
            }
        });
    }

    // Filter out conversations where the only member is the current user (self-chats)
    const displayChats = conversations?.conversations?.filter((chat: any) => {
        if (chat.isGroup) return true;
        const otherMember = chat.members?.find((m: any) => m._id !== currentUser?._id);
        return !!otherMember;
    }) || [];

    return (<>
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Forward Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {displayChats.map((chat: any) => {
                        const otherMember = chat.isGroup ? null : chat.members?.find((m: any) => m._id !== currentUser?._id);
                        const name = chat.isGroup ? chat.groupName : otherMember?.name;
                        const avatar = chat.isGroup ? chat.groupAvatar : otherMember?.avatar;
                        const subtitle = chat.isGroup ? "Group Chat" : otherMember?.email;
                        return (
                            <div key={chat._id} onClick={() => toggleChat(chat._id)}
                                className={`flex justify-between items-center cursor-pointer rounded-lg p-3 border transition-colors
                                ${selectedChats.includes(chat._id) ? "border-green-500 bg-green-500/10" : "border-zinc-700 hover:bg-zinc-800/50"}
                            `}>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-full border border-zinc-700">
                                        <AvatarImage src={avatar || ""} alt={name} />
                                        <AvatarFallback className="rounded-full bg-zinc-800 text-zinc-400">
                                            {name?.charAt(0)?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium text-white">{name}</p>
                                        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
                                    </div>
                                </div>
                                <input type="checkbox" checked={selectedChats.includes(chat._id)} readOnly className="h-4 w-4 accent-green-500" />
                            </div>
                        );
                    })}
                </div>
                <Button className="w-full mt-4" onClick={handleForward}>Forward</Button>
            </DialogContent>
        </Dialog>
    </>);
}