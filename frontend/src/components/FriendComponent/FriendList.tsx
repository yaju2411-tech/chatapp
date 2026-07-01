import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FriendDropdown from "../FriendComponent/FriendDropDown";
import { useClearChat } from "@/hooks/chatHook/useMessage";

interface Props {
    conversationId:any;
    friend: any;
    isOnline: boolean;
    unreadCount:number;
    onSelect: () => void;
    onDelete: () => void;
}

export default function FriendListItem({friend,onSelect,onDelete,isOnline,unreadCount,conversationId}: Props) {
    const clearChatMutation = useClearChat();
    return (<>
    <div className="flex items-center gap-3 p-4 border-b hover:bg-sidebar-accent cursor-pointer" onClick={onSelect}> 
    <Avatar size="lg">
        <AvatarImage src={friend.avatar} className={`${isOnline ? "border-3 border-green-500" : "border-0"}`}/> 
        <AvatarFallback> 
            {friend.name?.charAt(0)} 
            </AvatarFallback> 
        </Avatar>
        <div className="flex flex-col flex-1">
            <span className="flex font-medium items-center gap-1">
                {friend.name}
            </span>
            <span className="text-xs text-zinc-400">
                {friend.email}
            </span>
        </div>
        <div className="flex gap-2">
            {unreadCount > 0 && (
                <div className="w-7 h-7 rounded-full bg-green-500 text-white text-xs flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </div>
            )}
            <FriendDropdown friend={friend} onDelete={onDelete} onClearChat={()=>{
                clearChatMutation.mutate(conversationId);
            }}/>
        </div>
    </div>
    </>);
}
